import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/layout/SignOutButton";

export const dynamic = "force-dynamic";

/**
 * Dashboard del participante. Fase 1: estructura y ruta listas; el
 * contenido dinámico (próxima evaluación, historial) se conecta cuando
 * el StationEngine se exponga a participantes (Fase 2).
 */
export default async function MiEddoePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/mi-eddoe");

  const assessmentSession = await prisma.assessmentSession.findFirst({
    where: { userId: session.user.id },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy py-6 text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6">
          <img src="/logo-eddoe.png" alt="Logotipo EDDOE" className="h-12 w-12" />
          <div>
            <p className="font-serif text-lg font-bold text-gold">EDDOE</p>
            <h1 className="mt-1 text-2xl font-bold">Bienvenido(a), {session.user.email}</h1>
          </div>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <Card>
          <h2 className="font-semibold text-navy">Estado de tu inscripción</h2>
          <p className="mt-2 text-sm text-slate-600">
            <Badge tone="success">Cuenta activa</Badge>
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-navy">Próxima evaluación</h2>
          {assessmentSession ? (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Tu evaluación EDDOE está lista. Podrás recorrer la estación demo y las seis estaciones del
                circuito.
              </p>
              <div className="mt-4">
                <Link href={`/evaluacion/${assessmentSession.id}`}>
                  <Button variant="primary">Iniciar EDDOE</Button>
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              Aún no tienes una evaluación activada. Cuando el administrador la active, aparecerá aquí
              junto con el botón para iniciar la EDDOE.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-navy">Historial y resultados</h2>
          <p className="mt-2 text-sm text-slate-600">
            Todavía no tienes evaluaciones completadas.
          </p>
        </Card>
      </main>
    </div>
  );
}
