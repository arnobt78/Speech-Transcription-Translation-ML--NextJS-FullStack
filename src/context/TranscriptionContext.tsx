/**
 * Transcription Context — Central State Management
 *
 * This context provides a centralized store for all transcription-related
 * state and actions. It follows the React Context + useReducer pattern,
 * which is the recommended approach for managing complex state in React
 * without external libraries like Redux.
 *
 * Architecture decisions:
 * - Context is defined separately from the Provider (separation of concerns)
 * - All state is typed with TypeScript interfaces (no `any`)
 * - Actions are exposed as stable callbacks via the context value
 * - The worker ref is managed inside the provider, not exposed to consumers
 *
 * Usage:
 *   const { file, output, handleFormSubmission } = useTranscription();
 */

"use client";

import { createContext, useContext } from "react";
import type { TranscriptionChunk } from "@/types";

/** Shape of the transcription context value */
export interface TranscriptionContextValue {
  // ─── State ─────────────────────────────────────────────────
  /** The uploaded audio file (from file input) */
  file: File | null;
  /** The recorded audio stream (from MediaRecorder) */
  audioStream: Blob | null;
  /** Transcription results — array of timestamped text chunks */
  output: TranscriptionChunk[] | null;
  /** Whether the ML model is currently downloading */
  downloading: boolean;
  /** Current download progress percentage (0-100) */
  downloadProgress: number;
  /** Whether the ML model is loading/initializing */
  loading: boolean;
  /** Whether transcription has completed */
  finished: boolean;
  /** Error message from the transcription worker, null when no error */
  transcriptionError: string | null;
  /** Live log lines emitted during download + transcription */
  transcriptLogs: string[];
  /** ISO 639-1 language code detected by Whisper (e.g. "de", "fr"), null until transcription completes */
  detectedLanguage: string | null;
  /** ISO 639-1 source language selected by user for Whisper transcription */
  sourceLanguage: string;

  // ─── Actions ───────────────────────────────────────────────
  /** Set the uploaded file */
  setFile: (file: File | null) => void;
  /** Set the recorded audio stream */
  setAudioStream: (stream: Blob | null) => void;
  /** Set source language for Whisper transcription */
  setSourceLanguage: (lang: string) => void;
  /** Clear file and audio stream to start over */
  handleAudioReset: () => void;
  /** Begin the transcription process */
  handleFormSubmission: () => Promise<void>;
}

/**
 * React Context for transcription state.
 * Initialized as `null` — components must use the `useTranscription` hook
 * which throws an error if used outside the provider.
 */
// Default `null` forces consumers through `useTranscription()` which validates provider presence
export const TranscriptionContext =
  createContext<TranscriptionContextValue | null>(null);

/**
 * Custom hook to access the TranscriptionContext.
 *
 * This pattern ensures:
 * 1. Type safety — returns non-null type (no need for null checks)
 * 2. Developer experience — clear error message if misused
 * 3. Encapsulation — consumers don't need to know the context object
 *
 * @throws Error if used outside of TranscriptionProvider
 */
export function useTranscription(): TranscriptionContextValue {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error(
      "useTranscription must be used within a TranscriptionProvider. " +
        "Wrap your component tree with <AppProvider>.",
    );
  }
  return context;
}
