import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Consulta de estado — usada por /registro/estado. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const request = await prisma.registrationRequest.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, status: true, reviewNote: true, submittedAt: true, reviewedAt: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }
  return NextResponse.json(request);
}
