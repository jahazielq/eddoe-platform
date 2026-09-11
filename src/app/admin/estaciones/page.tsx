import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/**
 * Vista de sólo lectura del catálogo de estaciones (Station). El editor de
 * versiones (/admin/estaciones/:id/version/:versionId) y las acciones de
 * publicar/duplicar/archivar se implementan en Fase 2, sobre StationVersion.
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
        Catálogo base (Fase 1). El editor de versiones y publicación llegan en Fase 2.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stations.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-bold text-navy">{s.code}</span>
              <Badge tone={s.versions[0] ? "success" : "neutral"}>
                {s.versions[0] ? `v${s.versions[0].versionNumber} · ${s.versions[0].status}` : "Sin versión"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-700">{s.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
