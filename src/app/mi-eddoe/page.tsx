import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card, Badge } from "@/components/ui/Card";

/**
 * Dashboard del participante. Fase 1: estructura y ruta listas; el
 * contenido dinámico (próxima evaluación, historial) se conecta cuando
 * el StationEngine se exponga a participantes (Fase 2).
 */
export default async function MiEddoePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/mi-eddoe");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b-4 border-gold bg-navy py-6 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-serif text-lg font-bold text-gold">EDDOE</p>
          <h1 className="mt-1 text-2xl font-bold">Bienvenido(a), {session.user.email}</h1>
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
          <p className="mt-2 text-sm text-slate-600">
            Aún no hay una convocatoria asignada a tu perfil. Cuando exista, aparecerá aquí junto con la
            fecha, los requisitos y el botón para iniciar la EDDOE.
          </p>
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
