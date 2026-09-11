import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithSabina, type SabinaMessage } from "@/lib/ai/sabina";

const bodySchema = z.object({
  history: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string() })),
  message: z.string().min(1).max(2000),
});

/** Chat de la estación demo ("Conversación IA"). Aislado: sólo afecta esta estación. */
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const assessmentSession = await prisma.assessmentSession.findUnique({ where: { id: params.sessionId } });
  if (!assessmentSession || assessmentSession.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const reply = await chatWithSabina(parsed.data.history as SabinaMessage[], parsed.data.message);
  return NextResponse.json({ reply });
}
