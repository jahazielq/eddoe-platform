import type { AIProvider, AIEvaluationRequest, AIEvaluationResult } from "./AIProvider";

/**
 * Proveedor "nulo": no evalúa automáticamente, deja la evidencia lista para
 * que un EVALUATOR humano califique desde el panel. Útil como valor por
 * defecto seguro mientras una estación no tiene IA configurada o aprobada.
 */
export class ManualEvaluationProvider implements AIProvider {
  readonly name = "manual";

  async evaluate(request: AIEvaluationRequest): Promise<AIEvaluationResult> {
    return {
      raw: { pending: true, reason: "Evaluación manual pendiente por un EVALUATOR." },
      scores: request.rubric.criteria.map((criterion) => ({
        criterionId: criterion.id,
        levelId: "", // sin calificar todavía
        justification: undefined,
      })),
    };
  }
}
