import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

interface Props {
  params: { sessionId: string; order: string };
}

/**
 * Vista de una estación dentro del circuito. Fase 2 inicial: muestra el
 * contenido capturado desde /admin/estaciones (objetivo, escenario,
 * instrucciones, duración). La interacción por bloques (StationEngine)
 * y el temporizador en vivo se activan cuando existan bloques cargados.
 */
export default async function EstacionPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/evaluacion/${params.sessionId}/estacion/${params.order}`);

  const assessmentSession = await prisma.assessmentSession.findUnique({
    where: { id: params.sessionId },
    include: { blueprint: { include: { stations: { orderBy: { order: "asc" } } } } },
  });
  if (!assessmentSession) notFound();
  if (assessmentSession.userId !== session.user.id) redirect("/mi-eddoe");

  const orderNum = Number(params.order);
  const assessmentStation = assessmentSession.blueprint.stations.find((s) => s.order === orderNum);
  if (!assessmentStation) notFound();

  const stationVersion = await prisma.stationVersion.findUnique({
    where: { id: assessmentStation.stationVersionId },
    include: { blocks: { orderBy: { order: "asc" } }, station: true },
  });
  if (!stationVersion) notFound();

  const minutes = Math.round(stationVersion.durationSeconds / 60);
  const label = assessmentStation.isDemo ? "Estación demo" : `Estación ${assessmentStation.order}`;

  const stations = assessmentSession.blueprint.stations;
  const currentIndex = stations.findIndex((s) => s.order === orderNum);
  const prevStation = stations[currentIndex - 1];
  const nextStation = stations[currentIndex + 1];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy py-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6">
          <img src="/logo-eddoe.png" alt="Logotipo EDDOE" className="h-10 w-10" />
          <h1 className="font-serif text-lg font-bold">{label}</h1>
          <span className="ml-auto text-sm text-white/80">{minutes} min</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        {stationVersion.objective && (
          <Card>
            <h2 className="font-semibold text-navy">Objetivo</h2>
            <p className="mt-2 text-sm text-slate-700">{stationVersion.objective}</p>
          </Card>
        )}

        {stationVersion.scenario && (
          <Card>
            <h2 className="font-semibold text-navy">Escenario</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{stationVersion.scenario}</p>
          </Card>
        )}

        {stationVersion.instructions && (
          <Card>
            <h2 className="font-semibold text-navy">Instrucciones</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{stationVersion.instructions}</p>
          </Card>
        )}

        {stationVersion.blocks.length === 0 && (
          <Alert tone="info">
            El contenido interactivo de esta estación todavía se está integrando. Por ahora sólo se muestra
            la información general capturada desde el panel administrativo.
          </Alert>
        )}

        <div className="flex justify-between pt-4">
          {prevStation ? (
            <Link href={`/evaluacion/${assessmentSession.id}/estacion/${prevStation.order}`}>
              <Button variant="secondary">Anterior</Button>
            </Link>
          ) : (
            <span />
          )}
          {nextStation ? (
            <Link href={`/evaluacion/${assessmentSession.id}/estacion/${nextStation.order}`}>
              <Button variant="primary">Siguiente</Button>
            </Link>
          ) : (
            <Link href={`/evaluacion/${assessmentSession.id}`}>
              <Button variant="primary">Volver al circuito</Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
