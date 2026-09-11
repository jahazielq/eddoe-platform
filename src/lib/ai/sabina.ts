/**
 * "Sabina": persona conversacional empática para la Estación Demo (paso
 * "Conversación IA"). No es un evaluador — es un acompañamiento breve que
 * pregunta cómo se siente la persona docente ante la simulación. Usa
 * Gemini si hay API key configurada; si no, o si la llamada falla, cae en
 * respuestas empáticas predefinidas para que la demo nunca se rompa.
 */

export interface SabinaMessage {
  role: "user" | "model";
  text: string;
}

const SYSTEM_INSTRUCTION = `Actúa como una colega docente empática llamada Sabina. Conversas con una persona docente que está viviendo una simulación de evaluación (EDDOE).
Tu objetivo es conversar, reflexionar y escuchar con empatía cómo se siente emocionalmente ante este proceso, validando sus emociones (curiosidad, nerviosismo, escepticismo, etc.) con apoyo genuino.

Reglas:
1. No uses markdown ni listas: solo texto plano, fluido, sin saltos de línea.
2. Sé variada: no repitas siempre el mismo patrón; a veces pregunta, a veces solo valida la emoción o da ánimo.
3. Sé breve: entre 12 y 35 palabras por respuesta.
4. Trata siempre de "usted", con lenguaje cálido pero profesional.
5. Usa lenguaje neutro e inclusivo, sin asumir el género de quien te habla.`;

const FALLBACK_RESPONSES = [
  "Entiendo perfectamente que una simulación como esta genere algo de tensión; estoy aquí para acompañarle en este momento.",
  "Los nervios son parte natural de nuestra vocación docente. Con calma, recuerde que esto es solo un ejercicio para reflexionar sobre su bienestar.",
  "Es válido sentir curiosidad o incluso escepticismo al hablar de esto. ¿Qué es lo que más le preocupa de este proceso de evaluación?",
  "Agradezco que comparta cómo se siente. Tómese su tiempo, no hay prisa ni respuestas incorrectas en esta conversación.",
  "Comprendo. A veces basta con nombrar lo que sentimos para que pese un poco menos. ¿Desea contarme algo más al respecto?",
];

function fallbackReply(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]!;
}

const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];

export async function chatWithSabina(history: SabinaMessage[], userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackReply();

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const contents = [...history, { role: "user" as const, text: userMessage }].map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    for (const model of MODELS_TO_TRY) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.85 },
        });
        const text = response.text?.trim();
        if (text) return text;
      } catch {
        continue;
      }
    }
    return fallbackReply();
  } catch {
    return fallbackReply();
  }
}
