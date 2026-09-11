import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/**
 * Catálogo de estaciones. Cada tarjeta lleva al editor de contenido de esa
 * estación (/admin/estaciones/:code), donde se captura objetivo, escenario,
 * instrucciones y duración sin tocar código ni afectar a las demás.
 */
export default async function EstacionesPage() {
  const stations = await prisma.station.findMany({
    orderBy: { code: "asc" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Estaciones</h1>
      <p className="mt-1 text-sm text-slate-600">
        Da clic en una estación para capturar o actualizar su contenido (objetivo, escenario,
        instrucciones y duración). Guardar publica una nueva versión sin afectar a las demás estaciones.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stations.map((s) => (
          <Link key={s.id} href={`/admin/estaciones/${s.code}`}>
            <Card className="transition hover:border-gold hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-navy">
                  {s.code === "DEMO" ? "Demo" : s.code}
                </span>
                <Badge tone={s.versions[0] ? "success" : "neutral"}>
                  {s.versions[0] ? `v${s.versions[0].versionNumber} · ${s.versions[0].status}` : "Sin versión"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700">{s.name}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
