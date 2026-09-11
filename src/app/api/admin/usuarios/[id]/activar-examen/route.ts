import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";
import { logAuditEvent } from "@/lib/audit";

/**
 * Activa el examen EDDOE para un participante: crea su AssessmentSession
 * usando la convocatoria (Assessment/AssessmentBlueprint) vigente. No
 * duplica sesiones si ya tiene una en curso.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiPermission("assessment.activate");
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  const blueprint = await prisma.assessmentBlueprint.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!blueprint) {
    return NextResponse.json({ error: "No hay un circuito de estaciones configurado." }, { status: 500 });
  }

  const existing = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status });
  }

  const session = await prisma.assessmentSession.create({
    data: {
      assessmentId: blueprint.assessmentId,
      assessmentBlueprintId: blueprint.id,
      userId: user.id,
      status: "NOT_STARTED",
    },
  });

  await logAuditEvent({
    actorUserId: auth.session.user.id,
    action: "assessment.activated",
    entityType: "AssessmentSession",
    entityId: session.id,
    metadata: { participantUserId: user.id },
  });

  return NextResponse.json({ id: session.id, status: session.status }, { status: 201 });
}
