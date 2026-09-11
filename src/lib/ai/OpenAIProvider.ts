import type { AIProvider, AIEvaluationRequest, AIEvaluationResult } from "./AIProvider";

/** Adaptador para OpenAI. Misma idea que GeminiProvider — ver ese archivo. */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly apiKey: string = process.env.OPENAI_API_KEY ?? "") {}

  async evaluate(request: AIEvaluationRequest): Promise<AIEvaluationResult> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY no configurada.");
    }
    // TODO(fase 2): implementar con el SDK oficial de OpenAI (Structured Outputs
    // para forzar el cumplimiento de request.responseSchema).
    throw new Error("OpenAIProvider.evaluate no implementado todavía.");
  }
}
