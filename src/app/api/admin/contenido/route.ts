import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const auth = await requireApiPermission("content.edit");
  if ("error" in auth) return auth.error;

  const items = await prisma.publicContent.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(items);
}

const putSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
  type: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const auth = await requireApiPermission("content.edit");
  if ("error" in auth) return auth.error;

  const json = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const item = await prisma.publicContent.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value as any, type: parsed.data.type },
    create: { key: parsed.data.key, value: parsed.data.value as any, type: parsed.data.type ?? "text" },
  });

  await logAuditEvent({
    actorUserId: auth.session.user.id,
    action: "content.updated",
    entityType: "PublicContent",
    entityId: item.id,
    metadata: { key: item.key },
  });

  return NextResponse.json(item);
}
