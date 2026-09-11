import type { AIProvider, AIEvaluationRequest, AIEvaluationResult } from "./AIProvider";

/**
 * Adaptador para Google Gemini. Fase 1: estructura y contrato listos;
 * la llamada real al modelo se implementa en fase posterior junto con
 * la construcción de prompts versionados (promptVersion) y la validación
 * de salida contra `responseSchema`.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(private readonly apiKey: string = process.env.GEMINI_API_KEY ?? "") {}

  async evaluate(request: AIEvaluationRequest): Promise<AIEvaluationResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY no configurada.");
    }
    // TODO(fase 2): construir el prompt a partir de request.rubric + request.evidence,
    // invocar la API de Gemini, y validar la respuesta contra request.responseSchema
    // antes de retornarla.
    throw new Error("GeminiProvider.evaluate no implementado todavía.");
  }
}
