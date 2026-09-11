import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOrResumeAttempt } from "@/lib/station-engine/StationEngine";
import { logAuditEvent } from "@/lib/audit";

const bodySchema = z.object({
  fullName: z.string().min(1),
  opinion: z.string().min(10),
  audioDataUrl: z.string().nullable(),
  audioDurationSeconds: z.number().min(0),
  chatHistory: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string() })),
  chatSecondsElapsed: z.number().min(0),
});

/**
 * Cierra la estación demo: guarda las respuestas capturadas (nombre,
 * opinión, evidencia de audio, transcripción del chat) y publica un
 * FeedbackReport para que la persona docente lo vea despues en /mi-eddoe.
 * Aislado por completo del resto de estaciones y de la aplicacion.
 */
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const assessmentSession = await prisma.assessmentSession.findUnique({
    where: { id: params.sessionId },
    include: { blueprint: { include: { stations: true } } },
  });
  if (!assessmentSession || assessmentSession.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const demoStation = assessmentSession.blueprint.stations.find((s) => s.isDemo);
  if (!demoStation) return NextResponse.json({ error: "Estación demo no configurada." }, { status: 500 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const data = parsed.data;

  const attempt = await startOrResumeAttempt(assessmentSession.id, demoStation.stationVersionId);

  // Bloques fijos de la estación demo (se crean una sola vez).
  const blockDefs: Array<{ order: number; type: string; config: Record<string, unknown> }> = [
    { order: 1, type: "textResponse", config: { label: "Nombre completo" } },
    { order: 2, type: "longTextResponse", config: { label: "Opinión sobre la evaluación docente" } },
    { order: 3, type: "audioRecorder", config: { label: "Interacción oral" } },
    { order: 4, type: "aiConversation", config: { label: "Conversación IA (Sabina)" } },
  ];
  const blocks: Record<number, string> = {};
  for (const def of blockDefs) {
    const block = await prisma.stationBlock.upsert({
      where: { stationVersionId_order: { stationVersionId: demoStation.stationVersionId, order: def.order } },
      update: {},
      create: {
        stationVersionId: demoStation.stationVersionId,
        order: def.order,
        type: def.type,
        config: def.config as any,
      },
    });
    blocks[def.order] = block.id;
  }

  await prisma.response.upsert({
    where: { stationAttemptId_stationBlockId: { stationAttemptId: attempt.id, stationBlockId: blocks[1]! } },
    update: { value: data.fullName as any },
    create: { stationAttemptId: attempt.id, stationBlockId: blocks[1]!, value: data.fullName as any },
  });
  await prisma.response.upsert({
    where: { stationAttemptId_stationBlockId: { stationAttemptId: attempt.id, stationBlockId: blocks[2]! } },
    update: { value: data.opinion as any },
    create: { stationAttemptId: attempt.id, stationBlockId: blocks[2]!, value: data.opinion as any },
  });
  const chatResponse = await prisma.response.upsert({
    where: { stationAttemptId_stationBlockId: { stationAttemptId: attempt.id, stationBlockId: blocks[4]! } },
    update: { value: { history: data.chatHistory, secondsElapsed: data.chatSecondsElapsed } as any },
    create: {
      stationAttemptId: attempt.id,
      stationBlockId: blocks[4]!,
      value: { history: data.chatHistory, secondsElapsed: data.chatSecondsElapsed } as any,
    },
  });

  if (data.audioDataUrl) {
    const audioResponse = await prisma.response.upsert({
      where: { stationAttemptId_stationBlockId: { stationAttemptId: attempt.id, stationBlockId: blocks[3]! } },
      update: { value: { durationSeconds: data.audioDurationSeconds } as any },
      create: {
        stationAttemptId: attempt.id,
        stationBlockId: blocks[3]!,
        value: { durationSeconds: data.audioDurationSeconds } as any,
      },
    });
    const existingEvidence = await prisma.evidence.findFirst({ where: { responseId: audioResponse.id } });
    if (!existingEvidence) {
      await prisma.evidence.create({
        data: {
          stationAttemptId: attempt.id,
          responseId: audioResponse.id,
          evidenceType: "AUDIO",
          storageLocation: data.audioDataUrl,
        },
      });
    }
  }

  await prisma.stationAttempt.update({
    where: { id: attempt.id },
    data: { status: "EVALUATED", submittedAt: new Date() },
  });

  const feedbackContent = {
    fullName: data.fullName,
    opinion: data.opinion,
    audioDurationSeconds: data.audioDurationSeconds,
    chatMessageCount: data.chatHistory.length,
    chatSecondsElapsed: data.chatSecondsElapsed,
    completedAt: new Date().toISOString(),
    mensaje:
      "Gracias por completar la estación demo. Esta es una demostración: en el circuito real, cada estación se evalúa con una rúbrica y se integra a tu reporte final de la EDDOE.",
  };

  await prisma.feedbackReport.upsert({
    where: { sessionId: assessmentSession.id },
    update: { content: feedbackContent as any, publishedAt: new Date() },
    create: { sessionId: assessmentSession.id, content: feedbackContent as any, publishedAt: new Date() },
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    action: "demo.completed",
    entityType: "StationAttempt",
    entityId: attempt.id,
  });

  return NextResponse.json({ ok: true, chatResponseId: chatResponse.id });
}
