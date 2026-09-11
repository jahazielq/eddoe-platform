import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Devuelve el formulario de registro publicado vigente (público, sin auth). */
export async function GET() {
  const schema = await prisma.registrationFormSchema.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  });

  if (!schema) {
    return NextResponse.json({ error: "No hay un formulario de registro publicado." }, { status: 500 });
  }

  return NextResponse.json({ id: schema.id, fields: schema.fields });
}
