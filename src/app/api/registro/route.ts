import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * Paso 1 del registro: crea una RegistrationRequest en DRAFT y envía un
 * correo de verificación. No se pide más información aquí (regla: evitar
 * recolectar datos que no sean necesarios en cada paso).
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

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

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con este correo. Usa 'Iniciar sesión' o 'Recuperar acceso'." },
      { status: 409 }
    );
  }

  const verificationToken = randomUUID();

  const request = await prisma.registrationRequest.create({
    data: {
      email,
      formSchemaId: activeSchema.id,
      verificationToken,
      status: "DRAFT",
    },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/registro/perfil?token=${verificationToken}`;
  await sendEmail({
    to: email,
    subject: "Verifica tu correo — EDDOE",
    html: verificationEmailHtml(verifyUrl),
  });

  await logAuditEvent({
    action: "registration.created",
    entityType: "RegistrationRequest",
    entityId: request.id,
  });

  return NextResponse.json({ id: request.id }, { status: 201 });
}
