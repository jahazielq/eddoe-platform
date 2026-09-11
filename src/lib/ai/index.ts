import type { AIProvider } from "./AIProvider";
import { ManualEvaluationProvider } from "./ManualEvaluationProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAIProvider } from "./OpenAIProvider";

export type { AIProvider, AIEvaluationRequest, AIEvaluationResult } from "./AIProvider";

/**
 * Fábrica: resuelve el AIProvider a usar según `AIConfig.provider` (dato de
 * BD, versionado por estación) — nunca según una variable global fija.
 * Esto permite que E2 use Gemini y E5 use un proveedor distinto sin
 * ningún cambio de código.
 */
export function resolveAIProvider(providerName: string): AIProvider {
  switch (providerName) {
    case "gemini":
      return new GeminiProvider();
    case "openai":
      return new OpenAIProvider();
    case "manual":
    default:
      return new ManualEvaluationProvider();
  }
}
