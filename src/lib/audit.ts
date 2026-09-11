import { prisma } from "@/lib/prisma";

interface AuditInput {
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  stationAttemptId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra un evento de auditoría. Nunca incluir contraseñas, tokens ni
 * contenido de evidencias sensibles en `metadata` (regla #20).
 */
export async function logAuditEvent(input: AuditInput): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      stationAttemptId: input.stationAttemptId,
      metadata: input.metadata as any,
    },
  });
}
