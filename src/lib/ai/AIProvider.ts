/**
 * Contrato que debe cumplir cualquier proveedor de evaluación asistida.
 * Las estaciones NUNCA invocan Gemini/OpenAI directamente: siempre pasan
 * por esta interfaz, de modo que cambiar de proveedor (o usar evaluación
 * manual) no requiere tocar el StationEngine ni ninguna estación (regla #14).
 */
export interface RubricForAI {
  rubricVersionId: string;
  criteria: Array<{
    id: string;
    name: string;
    description?: string;
    levels: Array<{ id: string; label: string; points: number; descriptor: string }>;
  }>;
}

export interface AIEvaluationRequest {
  stationAttemptId: string;
  promptVersion: string;
  temperature?: number;
  /** Evidencia ya validada/anonimizada — nunca datos crudos sin revisar. */
  evidence: Array<{ blockType: string; value: unknown }>;
  rubric: RubricForAI;
  /** JSON Schema que la respuesta del proveedor debe cumplir. */
  responseSchema: Record<string, unknown>;
}

export interface AIEvaluationResult {
  /** Debe validar contra `responseSchema` antes de persistirse. */
  raw: Record<string, unknown>;
  scores: Array<{ criterionId: string; levelId: string; justification?: string }>;
}

export interface AIProvider {
  readonly name: string;
  evaluate(request: AIEvaluationRequest): Promise<AIEvaluationResult>;
}
