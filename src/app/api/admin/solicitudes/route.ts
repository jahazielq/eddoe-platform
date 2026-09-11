import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const auth = await requireApiPermission("registration.review");
  if ("error" in auth) return auth.error;

  const status = req.nextUrl.searchParams.get("status");

  const requests = await prisma.registrationRequest.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(requests);
}
