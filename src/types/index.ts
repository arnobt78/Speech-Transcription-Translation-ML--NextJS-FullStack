/**
 * TypeScript type definitions for the FreeScribe application.
 *
 * This file centralizes all shared types used across the app,
 * ensuring type safety and consistency. Using a single types file
 * is a common pattern in small-to-medium React/Next.js projects.
 *
 * Key concepts demonstrated:
 * - `as const` assertions for literal types (enums without enum keyword)
 * - Discriminated union types for type-safe message handling
 * - Utility types like `Record<K, V>` for typed objects
 * - Interface vs Type: we use `interface` for object shapes (extendable)
 *   and `type` for unions, intersections, and aliases
 */

// ─── Message Types ───────────────────────────────────────────────────────────
// These constants define the communication protocol between the main thread
// and Web Workers. Using `as const` makes TypeScript infer literal types
// instead of just `string`, enabling exhaustive switch/case checking.

export const MessageTypes = {
  DOWNLOADING: "DOWNLOADING",
  LOADING: "LOADING",
  RESULT: "RESULT",
  RESULT_PARTIAL: "RESULT_PARTIAL",
  INFERENCE_REQUEST: "INFERENCE_REQUEST",
  INFERENCE_DONE: "INFERENCE_DONE",
  ERROR: "ERROR",
} as const;

/** Union type of all valid message type strings */
export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

// ─── Loading Status ──────────────────────────────────────────────────────────

export const LoadingStatus = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
} as const;

export type LoadingStatusType =
  (typeof LoadingStatus)[keyof typeof LoadingStatus];

// ─── Model Names ─────────────────────────────────────────────────────────────
// Available OpenAI Whisper models for speech-to-text transcription.
// Smaller models are faster but less accurate; larger models are more accurate
// but require more download time and memory.

export const ModelNames = {
  WHISPER_TINY_EN: "openai/whisper-tiny.en",
  WHISPER_TINY: "openai/whisper-tiny",
  WHISPER_BASE: "openai/whisper-base",
  WHISPER_BASE_EN: "openai/whisper-base.en",
  WHISPER_SMALL: "openai/whisper-small",
  WHISPER_SMALL_EN: "openai/whisper-small.en",
} as const;

export type ModelName = (typeof ModelNames)[keyof typeof ModelNames];

// ─── Recording Status ────────────────────────────────────────────────────────
// Represents the current state of audio recording via the MediaRecorder API

export type RecordingStatus = "inactive" | "recording";

// ─── Transcription Result ────────────────────────────────────────────────────
// Each chunk of transcribed audio produces a result with text and timestamps

export interface TranscriptionChunk {
  /** Index of this chunk in the transcription sequence */
  index: number;
  /** The transcribed text content */
  text: string;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

// ─── Worker Message Types ────────────────────────────────────────────────────
// Discriminated unions for type-safe worker message handling.
// The `type` field acts as the discriminant — TypeScript can narrow
// the type inside switch/case blocks based on this field.

/** Messages sent FROM the Whisper worker TO the main thread */
export type WhisperWorkerMessage =
  | {
      type: typeof MessageTypes.DOWNLOADING;
      file: string;
      progress: number;
      loaded: number;
      total: number;
    }
  | { type: typeof MessageTypes.LOADING; status: string }
  | {
      type: typeof MessageTypes.RESULT;
      results: TranscriptionChunk[];
      isDone: boolean;
      completedUntilTimestamp: number;
    }
  | { type: typeof MessageTypes.RESULT_PARTIAL; result: PartialResult }
  | { type: typeof MessageTypes.INFERENCE_DONE }
  | { type: typeof MessageTypes.ERROR; error: string };

/** Partial transcription result before final chunk processing */
export interface PartialResult {
  text: string;
  start: number;
  end: number | undefined;
}

/** Messages sent TO the Whisper worker FROM the main thread */
export interface WhisperInferenceRequest {
  type: typeof MessageTypes.INFERENCE_REQUEST;
  audio: Float32Array;
  model_name: string;
}

/** Messages sent FROM the Translate worker TO the main thread */
export type TranslateWorkerMessage =
  | { status: "initiate" }
  | { status: "progress"; progress: number }
  | { status: "update"; output: string }
  | { status: "complete"; output: TranslationOutput[] };

/** Single translation output entry */
export interface TranslationOutput {
  translation_text: string;
}

/** Messages sent TO the Translate worker FROM the main thread */
export interface TranslateRequest {
  text: string[];
  src_lang: string;
  tgt_lang: string;
}

// ─── Tab Types ───────────────────────────────────────────────────────────────

export type TabType = "transcription" | "translation";

// ─── Component Props ─────────────────────────────────────────────────────────
// Defining props as interfaces rather than inline types provides:
// 1. Better documentation through JSDoc comments
// 2. Reusability across components
// 3. Easier refactoring

export interface HomePageProps {
  setFile: (file: File | null) => void;
  setAudioStream: (stream: Blob | null) => void;
}

export interface FileDisplayProps {
  file: File | null;
  audioStream: Blob | null;
  handleFormSubmission: () => void;
  handleAudioReset: () => void;
}

export interface InformationProps {
  output: TranscriptionChunk[];
  finished: boolean;
}

export interface TranscribingProps {
  downloading: boolean;
  downloadProgress: number;
  error?: string | null;
}

export interface TranscriptionDisplayProps {
  textElement: string[];
}

export interface TranslationProps {
  output: TranscriptionChunk[];
  finished: boolean;
  toLanguage: string;
  translating: boolean;
  setToLanguage: (lang: string) => void;
  generateTranslation: () => void;
}

// ─── Transcription History ───────────────────────────────────────────────────
// For storing past transcriptions in localStorage

export interface TranscriptionHistoryEntry {
  id: string;
  date: string;
  fileName: string;
  chunks: TranscriptionChunk[];
  translation?: string;
}

// ─── Export Format Types ─────────────────────────────────────────────────────

export type ExportFormat = "txt" | "srt" | "vtt";
