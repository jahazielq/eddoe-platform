import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";

export async function GET() {
  const auth = await requireApiPermission("user.manage");
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      roles: { select: { role: { select: { code: true, name: true } } } },
      participantProfile: { select: { firstName: true, lastNamePaterno: true } },
    },
  });

  return NextResponse.json(users);
}
