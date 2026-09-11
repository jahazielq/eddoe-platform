import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

/** Muestra la realimentación publicada de una sesión (regla: los resultados quedan disponibles después). */
export default async function ResultadosPage({ params }: { params: { sessionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/mi-eddoe/resultados/${params.sessionId}`);

  const assessmentSession = await prisma.assessmentSession.findUnique({ where: { id: params.sessionId } });
  if (!assessmentSession) notFound();
  if (assessmentSession.userId !== session.user.id) redirect("/mi-eddoe");

  const report = await prisma.feedbackReport.findUnique({ where: { sessionId: params.sessionId } });
  if (!report || !report.publishedAt) notFound();

  const content = report.content as Record<string, any>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy py-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6">
          <img src="/logo-eddoe.png" alt="Logotipo EDDOE" className="h-10 w-10" />
          <h1 className="font-serif text-lg font-bold">Resultado y realimentación</h1>
          <Link href="/mi-eddoe" className="ml-auto">
            <Button variant="ghost" className="!border-white/60 !text-white hover:!bg-white/10">
              ← Volver al inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <Alert tone="info">{content.mensaje ?? "Resultado disponible."}</Alert>

        <Card>
          <h2 className="font-semibold text-navy">Resumen de tu participación</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-500">Nombre</td>
                <td className="py-2 text-right">{content.fullName ?? "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-500">Opinión registrada</td>
                <td className="py-2 text-right">{content.opinion ?? "—"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-500">Audio grabado</td>
                <td className="py-2 text-right">{content.audioDurationSeconds ?? 0} segundos</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-semibold text-slate-500">Conversación con Sabina</td>
                <td className="py-2 text-right">{content.chatMessageCount ?? 0} mensaje(s)</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-slate-500">Completado el</td>
                <td className="py-2 text-right">
                  {content.completedAt ? new Date(content.completedAt).toLocaleString("es-MX") : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
