import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Resuelve una RegistrationRequest a partir del token enviado por correo. */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.registrationRequest.findUnique({
    where: { verificationToken: params.token },
    include: { formSchema: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Enlace inválido o expirado." }, { status: 404 });
  }
  return NextResponse.json({
    id: request.id,
    email: request.email,
    status: request.status,
    answers: request.answers,
    fields: request.formSchema.fields,
  });
}
