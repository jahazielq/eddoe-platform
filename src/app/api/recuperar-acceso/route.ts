import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

const bodySchema = z.object({ email: z.string().email() });

/**
 * Solicita recuperación de acceso. Responde siempre 200 exista o no la
 * cuenta, para no filtrar qué correos están registrados.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Correo inválido." }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/recuperar-acceso/confirmar?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Recupera tu acceso — EDDOE",
      html: `<p>Da clic para establecer una nueva contraseña (válido 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
    await logAuditEvent({ actorUserId: user.id, action: "auth.passwordResetRequested" });
  }

  return NextResponse.json({ ok: true });
}
