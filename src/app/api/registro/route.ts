import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";
import type { RegistrationField } from "@/lib/registration/formSchema";

const bodySchema = z.object({
  answers: z.record(z.unknown()),
});

/**
 * Envía la solicitud de inscripción completa en un solo paso (sin
 * verificación de correo previa): valida obligatoriedad en servidor contra
 * el `RegistrationFormSchema` publicado y crea la `RegistrationRequest` ya
 * como `SUBMITTED`, lista para revisión administrativa.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const activeSchema = await prisma.registrationFormSchema.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  });
  if (!activeSchema) {
    return NextResponse.json(
      { error: "No hay un formulario de registro publicado. Contacta al administrador." },
      { status: 500 }
    );
  }

  const answers = parsed.data.answers;
  const fields = activeSchema.fields as unknown as RegistrationField[];

  const missing = fields
    .filter((f) => f.visible && f.required)
    .filter((f) => {
      const v = answers[f.key];
      if (Array.isArray(v)) return v.length === 0;
      return v === undefined || v === null || v === "" || v === false;
    });

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios.", fields: missing.map((f) => f.key) },
      { status: 400 }
    );
  }

  const email = String(answers.correoAcceso ?? "").toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Falta el correo de acceso." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con este correo. Usa 'Iniciar sesión' o 'Recuperar acceso'." },
      { status: 409 }
    );
  }

  const request = await prisma.registrationRequest.create({
    data: {
      email,
      formSchemaId: activeSchema.id,
      answers: answers as any,
      privacyAccepted: Boolean(answers.privacyAccepted),
      termsAccepted: Boolean(answers.termsAccepted),
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  await sendEmail({
    to: email,
    subject: "Recibimos tu solicitud — EDDOE",
    html: `<p>Recibimos tu solicitud de inscripción a la EDDOE. Un administrador la revisará en breve.</p><p>Tu folio de seguimiento es: <strong>${request.id}</strong></p>`,
  });

  await logAuditEvent({
    action: "registration.submitted",
    entityType: "RegistrationRequest",
    entityId: request.id,
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
