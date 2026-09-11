import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

/**
 * Helper para Route Handlers de /api/admin/*: obtiene la sesión y valida
 * el permiso en servidor. Si falla, retorna directamente la respuesta 401/403
 * que el caller debe propagar.
 */
export async function requireApiPermission(permission: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) } as const;
  }
  if (!hasPermission(session.user.roles, permission)) {
    return { error: NextResponse.json({ error: "No autorizado." }, { status: 403 }) } as const;
  }
  return { session } as const;
}
