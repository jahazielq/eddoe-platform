import { prisma } from "@/lib/prisma";
import type { RoleCode } from "@prisma/client";

/**
 * Matriz de permisos por rol (ver docs/ARCHITECTURE.md #8).
 * Vive en código porque son reglas de negocio estables; los datos que sí
 * cambian con frecuencia (contenido, formularios, estaciones) viven en BD.
 */
export const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  SUPER_ADMIN: [
    "registration.review",
    "registration.approve",
    "user.manage",
    "content.edit",
    "station.editDraft",
    "station.publish",
    "rubric.editPublished",
    "evidence.view",
    "audit.view",
    "assessment.activate",
  ],
  ACADEMIC_ADMIN: [
    "registration.review",
    "registration.approve",
    "content.edit",
    "station.editDraft",
    "station.publish",
    "evidence.view",
    "audit.view",
    "assessment.activate",
  ],
  STATION_EDITOR: ["station.editDraft"],
  EVALUATOR: ["evidence.view.assigned"],
  SUPPORT: ["audit.view.technical"],
  PARTICIPANT: ["assessment.take"],
};

export function roleHasPermission(role: RoleCode, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Verifica en servidor si alguno de los roles del usuario tiene el permiso. */
export function hasPermission(userRoles: RoleCode[], permission: string): boolean {
  return userRoles.some((role) => roleHasPermission(role, permission));
}

/**
 * Carga los roles de un usuario desde la base de datos.
 * Usar siempre esto en Route Handlers / Server Actions antes de autorizar
 * una acción — nunca confiar en el rol que llega desde el cliente.
 */
export async function getUserRoles(userId: string): Promise<RoleCode[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role.code);
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`No autorizado: falta el permiso "${permission}"`);
    this.name = "ForbiddenError";
  }
}

/** Lanza ForbiddenError si el usuario no tiene el permiso solicitado. */
export async function requirePermission(userId: string, permission: string): Promise<void> {
  const roles = await getUserRoles(userId);
  if (!hasPermission(roles, permission)) {
    throw new ForbiddenError(permission);
  }
}
