import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import type { RegistrationField } from "@/lib/registration/formSchema";

/** Consulta de estado — usada por /registro/estado. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const request = await prisma.registrationRequest.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, status: true, reviewNote: true, submittedAt: true, reviewedAt: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }
  return NextResponse.json(request);
}

const patchSchema = z.object({
  token: z.string().uuid(),
  answers: z.record(z.unknown()),
  privacyAccepted: z.literal(true),
  termsAccepted: z.literal(true),
});

/**
 * Paso 2 del registro: completa el perfil (RegistrationFormSchema dinámico)
 * y envía la solicitud a revisión. Valida obligatoriedad en servidor,
 * nunca sólo en el cliente.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id: params.id },
    include: { formSchema: true },
  });
  if (!request || request.verificationToken !== parsed.data.token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 403 });
  }
  if (request.status !== "DRAFT" && request.status !== "NEEDS_CHANGES") {
    return NextResponse.json({ error: "Esta solicitud ya fue enviada." }, { status: 409 });
  }

  const fields = request.formSchema.fields as unknown as RegistrationField[];
  const missing = fields
    .filter((f) => f.visible && f.required)
    .filter((f) => {
      const value = parsed.data.answers[f.key];
      return value === undefined || value === null || value === "" || value === false;
    });

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios.", fields: missing.map((f) => f.key) },
      { status: 400 }
    );
  }

  const updated = await prisma.registrationRequest.update({
    where: { id: request.id },
    data: {
      answers: parsed.data.answers as any,
      privacyAccepted: true,
      termsAccepted: true,
      verifiedAt: request.verifiedAt ?? new Date(),
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await logAuditEvent({
    action: "registration.submitted",
    entityType: "RegistrationRequest",
    entityId: updated.id,
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
