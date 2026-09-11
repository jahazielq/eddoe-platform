import { prisma } from "@/lib/prisma";

/**
 * Lee el contenido público administrable (landing, FAQ, avisos) sin
 * incrustar textos en componentes React (regla #3). Si una llave no existe
 * todavía en BD, se usa `fallback` para que la página nunca se rompa.
 */
export async function getPublicContent<T = unknown>(key: string, fallback: T): Promise<T> {
  const row = await prisma.publicContent.findUnique({ where: { key } });
  return (row?.value as T) ?? fallback;
}

export async function getAllPublicContent(): Promise<Record<string, unknown>> {
  const rows = await prisma.publicContent.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
