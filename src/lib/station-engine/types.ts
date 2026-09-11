/** Tipos de bloque soportados por el StationEngine (regla #9). */
export type BlockType =
  | "richText"
  | "instructions"
  | "scenario"
  | "image"
  | "video"
  | "pdf"
  | "downloadableResource"
  | "multipleChoice"
  | "singleSelect"
  | "multiSelect"
  | "textResponse"
  | "longTextResponse"
  | "audioRecorder"
  | "videoRecorder"
  | "checklist"
  | "timer"
  | "articleViewer"
  | "simulation"
  | "aiConversation"
  | "confirmation";

export interface ResolvedBlock {
  id: string;
  order: number;
  type: BlockType;
  config: Record<string, unknown>;
  responseSchema?: {
    kind: "text" | "audio" | "video" | "selection" | "checklist" | "file";
    required: boolean;
  };
}

export interface ResolvedStation {
  stationVersionId: string;
  stationCode: string;
  durationSeconds: number;
  objective?: string | null;
  scenario?: string | null;
  instructions?: string | null;
  blocks: ResolvedBlock[];
}

/** Contexto de un intento en curso, calculado en servidor. */
export interface AttemptContext {
  stationAttemptId: string;
  startedAt: string; // ISO
  expiresAt: string; // ISO — el cliente sólo la representa, no la calcula
  timeoutBehavior: "AUTO_SUBMIT" | "LOCK" | "ALLOW_GRACE_PERIOD";
  isTestAttempt: boolean;
}
