import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [pending, accounts, submitted] = await Promise.all([
    prisma.registrationRequest.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.user.count(),
    prisma.registrationRequest.count(),
  ]);

  const stats = [
    { label: "Solicitudes pendientes de revisión", value: pending },
    { label: "Usuarios registrados", value: accounts },
    { label: "Solicitudes totales", value: submitted },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-3xl font-bold text-navy">{s.value}</p>
            <p className="mt-1 text-sm text-slate-600">{s.label}</p>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Evaluaciones activas, aplicaciones en curso, incidencias y estado de procesamiento de IA se
        habilitan cuando el StationEngine se exponga a participantes (Fase 2).
      </p>
    </div>
  );
}
