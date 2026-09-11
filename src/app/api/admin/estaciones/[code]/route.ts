import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireApiPermission("station.editDraft");
  if ("error" in auth) return auth.error;

  const station = await prisma.station.findUnique({ where: { code: params.code } });
  if (!station) return NextResponse.json({ error: "Estación no encontrada." }, { status: 404 });

  const version = await prisma.stationVersion.findFirst({
    where: { stationId: station.id },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json({ station, version });
}

const bodySchema = z.object({
  durationMinutes: z.number().min(1).max(60),
  objective: z.string().optional(),
  scenario: z.string().optional(),
  instructions: z.string().optional(),
});

/**
 * Guarda el contenido de una estación creando una nueva StationVersion
 * publicada (nunca se edita en sitio una versión existente — regla de
 * versionado del StationEngine) y archivando la anterior.
 */
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireApiPermission("station.publish");
  if ("error" in auth) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const station = await prisma.station.findUnique({ where: { code: params.code } });
  if (!station) return NextResponse.json({ error: "Estación no encontrada." }, { status: 404 });

  const previous = await prisma.stationVersion.findFirst({
    where: { stationId: station.id },
    orderBy: { versionNumber: "desc" },
  });

  const newVersion = await prisma.$transaction(async (tx) => {
    if (previous && previous.status === "PUBLISHED") {
      await tx.stationVersion.update({ where: { id: previous.id }, data: { status: "ARCHIVED" } });
    }
    return tx.stationVersion.create({
      data: {
        stationId: station.id,
        versionNumber: (previous?.versionNumber ?? 0) + 1,
        status: "PUBLISHED",
        durationSeconds: parsed.data.durationMinutes * 60,
        objective: parsed.data.objective || null,
        scenario: parsed.data.scenario || null,
        instructions: parsed.data.instructions || null,
        createdById: auth.session.user.id,
        publishedAt: new Date(),
      },
    });
  });

  // Las convocatorias existentes deben apuntar a la nueva versión para que
  // los participantes vean el contenido actualizado en su próxima estación.
  await prisma.assessmentStation.updateMany({
    where: { stationVersionId: previous?.id ?? "__none__" },
    data: { stationVersionId: newVersion.id },
  });

  await logAuditEvent({
    actorUserId: auth.session.user.id,
    action: "station.published",
    entityType: "StationVersion",
    entityId: newVersion.id,
    metadata: { stationCode: station.code, versionNumber: newVersion.versionNumber },
  });

  return NextResponse.json(newVersion, { status: 201 });
}
