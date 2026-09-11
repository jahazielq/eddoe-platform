import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicContent } from "@/lib/publicContent";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StationRing } from "@/components/evaluacion/StationRing";

export const dynamic = "force-dynamic";

export default async function EvaluacionPage({ params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/evaluacion/${params.sessionId}`);

  const assessmentSession = await prisma.assessmentSession.findUnique({
    where: { id: params.sessionId },
    include: {
      blueprint: {
        include: {
          stations: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!assessmentSession) notFound();
  if (assessmentSession.userId !== session.user.id) {
    // Sólo el propio participante puede ver su evaluación (un admin la consulta desde /admin).
    redirect("/mi-eddoe");
  }

  if (assessmentSession.status === "NOT_STARTED") {
    await prisma.assessmentSession.update({
      where: { id: assessmentSession.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  const [videoUrl, bienvenida, instrucciones, creditos] = await Promise.all([
    getPublicContent("evaluacion.videoUrl", ""),
    getPublicContent("evaluacion.bienvenida", ""),
    getPublicContent("evaluacion.instrucciones", ""),
    getPublicContent("evaluacion.creditos", ""),
  ]);
  const embedUrl = youtubeEmbedUrl(videoUrl as string);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy py-6 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6">
          <img src="/logo-eddoe.png" alt="Logotipo EDDOE" className="h-12 w-12" />
          <h1 className="font-serif text-xl font-bold">Evaluación del Desempeño Docente Objetiva Estructurada</h1>
          <Link href="/mi-eddoe" className="ml-auto">
            <Button variant="ghost" className="!border-white/60 !text-white hover:!bg-white/10">
              ← Volver al inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <Card>
          <h2 className="font-semibold text-navy">Bienvenida</h2>
          <p className="mt-2 text-sm text-slate-700">{bienvenida as string}</p>
        </Card>

        <section>
          <h2 className="mb-6 text-center font-serif text-lg font-bold text-navy">Circuito de estaciones</h2>
          <StationRing
            stations={assessmentSession.blueprint.stations.map((st) => ({
              order: st.order,
              isDemo: st.isDemo,
              href: `/evaluacion/${assessmentSession.id}/estacion/${st.order}`,
            }))}
          />
        </section>

        <Card>
          <h2 className="font-semibold text-navy">Instrucciones</h2>
          <p className="mt-2 text-sm text-slate-700">{instrucciones as string}</p>
        </Card>

        {embedUrl && (
          <details className="group rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-navy">
              Video introductorio
              <span className="text-sm text-navy-light transition group-open:rotate-180">▾</span>
            </summary>
            <div className="px-6 pb-6">
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <iframe
                  src={embedUrl}
                  title="Video introductorio EDDOE"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </details>
        )}

        <Card>
          <h2 className="font-semibold text-navy">Créditos</h2>
          <p className="mt-2 text-sm text-slate-700">{creditos as string}</p>
        </Card>
      </main>
    </div>
  );
}
