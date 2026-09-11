import { prisma } from "@/lib/prisma";
import type { ResolvedStation, ResolvedBlock, BlockType } from "./types";

/**
 * Motor único que resuelve e interpreta CUALQUIER estación a partir de su
 * configuración versionada. No existen `Station1Component`..`Station6Component`:
 * la ruta `/evaluacion/:sessionId/estacion/:stationId` siempre usa este motor
 * (regla #1). No se expone a participantes en la Fase 1 — se deja lista la
 * resolución server-side para cuando se habilite el circuito real.
 */
export async function resolveStation(stationVersionId: string): Promise<ResolvedStation> {
  const version = await prisma.stationVersion.findUniqueOrThrow({
    where: { id: stationVersionId },
    include: {
      station: true,
      blocks: { orderBy: { order: "asc" } },
    },
  });

  const blocks: ResolvedBlock[] = version.blocks.map((b) => ({
    id: b.id,
    order: b.order,
    type: b.type as BlockType,
    config: (b.config as Record<string, unknown>) ?? {},
    responseSchema: b.responseSchema as ResolvedBlock["responseSchema"],
  }));

  return {
    stationVersionId: version.id,
    stationCode: version.station.code,
    durationSeconds: version.durationSeconds,
    objective: version.objective,
    scenario: version.scenario,
    instructions: version.instructions,
    blocks,
  };
}

/**
 * Inicia (o recupera) un intento de estación dentro de una sesión, fijando
 * `stationVersionId` y calculando `expiresAt` en el servidor (regla #18).
 * Recargar la página nunca reinicia el cronómetro porque el cliente sólo
 * lee `expiresAt`, no lo calcula.
 */
export async function startOrResumeAttempt(sessionId: string, stationVersionId: string) {
  const existing = await prisma.stationAttempt.findFirst({
    where: { sessionId, stationVersionId },
  });
  if (existing) return existing;

  const version = await prisma.stationVersion.findUniqueOrThrow({
    where: { id: stationVersionId },
  });

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + version.durationSeconds * 1000);

  return prisma.stationAttempt.create({
    data: {
      sessionId,
      stationVersionId,
      status: "IN_PROGRESS",
      startedAt,
      expiresAt,
    },
  });
}
