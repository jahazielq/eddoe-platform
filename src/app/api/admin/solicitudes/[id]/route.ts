import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail, accessGrantedEmailHtml } from "@/lib/email";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "NEEDS_CHANGES"]),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiPermission("registration.review");
  if ("error" in auth) return auth.error;

  const request = await prisma.registrationRequest.findUnique({
    where: { id: params.id },
    include: { formSchema: true },
  });
  if (!request) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  return NextResponse.json(request);
}

/**
 * Aprobar, rechazar o pedir corrección de una solicitud. Al aprobar:
 * crea el User + ParticipantProfile + rol PARTICIPANT, y envía el correo
 * de acceso — todo auditado.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiPermission("registration.approve");
  if ("error" in auth) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = decisionSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const request = await prisma.registrationRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(request.status)) {
    return NextResponse.json({ error: "La solicitud no está en revisión." }, { status: 409 });
  }

  const reviewerId = auth.session.user.id;

  if (parsed.data.decision === "REJECT") {
    await prisma.registrationRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", reviewNote: parsed.data.note, reviewedById: reviewerId, reviewedAt: new Date() },
    });
    await logAuditEvent({ actorUserId: reviewerId, action: "registration.rejected", entityType: "RegistrationRequest", entityId: request.id });
    return NextResponse.json({ status: "REJECTED" });
  }

  if (parsed.data.decision === "NEEDS_CHANGES") {
    await prisma.registrationRequest.update({
      where: { id: request.id },
      data: { status: "NEEDS_CHANGES", reviewNote: parsed.data.note, reviewedById: reviewerId, reviewedAt: new Date() },
    });
    await logAuditEvent({ actorUserId: reviewerId, action: "registration.needsChanges", entityType: "RegistrationRequest", entityId: request.id });
    return NextResponse.json({ status: "NEEDS_CHANGES" });
  }

  // APPROVE: crea la cuenta y el perfil.
  const answers = (request.answers as Record<string, any>) ?? {};
  const temporaryPassword = randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: request.email,
        passwordHash,
        emailVerified: request.verifiedAt ?? new Date(),
        status: "PENDING_PASSWORD",
      },
    });

    const participantRole = await tx.role.findUniqueOrThrow({ where: { code: "PARTICIPANT" } });
    await tx.userRole.create({ data: { userId: user.id, roleId: participantRole.id } });

    await tx.participantProfile.create({
      data: {
        userId: user.id,
        firstName: answers.firstName ?? "",
        lastNamePaterno: answers.lastNamePaterno ?? "",
        lastNameMaterno: answers.lastNameMaterno ?? null,
        employeeNumber: answers.employeeNumber ?? null,
        profession: answers.profession ?? null,
        academicDegree: answers.academicDegree ?? null,
        department: answers.department ?? null,
        program: answers.program ?? null,
        subjectsTaught: answers.subjectsTaught ?? null,
        campus: answers.campus ?? null,
        yearsOfExperience: answers.yearsOfExperience ? Number(answers.yearsOfExperience) : null,
        teachingActivity: answers.teachingActivity ?? null,
      },
    });

    await tx.registrationRequest.update({
      where: { id: request.id },
      data: {
        status: "ACCOUNT_CREATED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        createdUserId: user.id,
      },
    });

    return user;
  });

  const loginUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/login`;
  await sendEmail({
    to: request.email,
    subject: "Tu acceso a EDDOE fue aprobado",
    html: accessGrantedEmailHtml(loginUrl, `Tu contraseña temporal es: ${temporaryPassword}`),
  });

  await logAuditEvent({
    actorUserId: reviewerId,
    action: "registration.approved",
    entityType: "RegistrationRequest",
    entityId: request.id,
    metadata: { createdUserId: result.id },
  });

  return NextResponse.json({ status: "ACCOUNT_CREATED", userId: result.id });
}
