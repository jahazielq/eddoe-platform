import { Alert } from "@/components/ui/Card";

export default function EvaluacionesPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-navy">Evaluaciones</h1>
      <div className="mt-6">
        <Alert tone="info">
          Módulo de Fase 2: convocatorias, asignación de participantes y blueprints (
          <code>Assessment</code>, <code>AssessmentBlueprint</code>). El modelo de datos ya existe en{" "}
          <code>prisma/schema.prisma</code>.
        </Alert>
      </div>
    </div>
  );
}
