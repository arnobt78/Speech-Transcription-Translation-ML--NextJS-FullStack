/**
 * App Provider — Root Client-Side Provider Component
 *
 * In Next.js App Router, the root layout is a Server Component by default.
 * However, React Context requires client-side rendering. The solution is
 * to create a separate "use client" provider component that wraps the
 * application with all necessary context providers.
 *
 * This pattern is called the "Provider Component Pattern" and is the
 * recommended approach in Next.js for providing client-side context
 * to Server Component layouts.
 *
 * The provider manages:
 * - Transcription state (file, audio, output, loading states)
 * - Whisper worker lifecycle (instantiation, message handling)
 * - Audio processing (reading files, decoding audio data)
 */

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  TranscriptionContext,
  type TranscriptionContextValue,
} from "@/context/TranscriptionContext";
import { MessageTypes } from "@/data/presets";
import { appToast } from "@/lib/toasts";
import type { TranscriptionChunk, WhisperWorkerMessage } from "@/types";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // ─── State ───────────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [audioStream, setAudioStream] = useState<Blob | null>(null);
  const [output, setOutput] = useState<TranscriptionChunk[] | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const [transcriptLogs, setTranscriptLogs] = useState<string[]>([]);

  /** Append a timestamped line to the live log panel */
  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTranscriptLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  }, []);
  // useRef persists the Worker instance across re-renders without
  // triggering re-renders when it changes (unlike useState)
  const worker = useRef<Worker | null>(null);

  // ─── Worker Initialization ──────────────────────────────────────────
  // Web Workers run JavaScript in a background thread, keeping the UI
  // responsive during heavy ML computations. We instantiate the worker
  // once and communicate via postMessage/addEventListener.
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL("@/workers/whisper.worker.ts", import.meta.url),
        { type: "module" },
      );
    }

    /** Dispatches worker → main thread messages (see `WhisperWorkerMessage` in types). */
    const onMessageReceived = (e: MessageEvent<WhisperWorkerMessage>) => {
      switch (e.data.type) {
        case MessageTypes.DOWNLOADING:
          // Model weights downloading from Hugging Face Hub (first visit or cache miss)
          setDownloading(true);
          setDownloadProgress(e.data.progress);
          if (Math.round(e.data.progress) % 10 === 0) {
            addLog(
              `Downloading Whisper model… ${Math.round(e.data.progress)}%`,
            );
          }
          break;
        case MessageTypes.LOADING:
          // Weights ready; worker is about to run inference on decoded audio
          setLoading(true);
          addLog("Model ready — preparing audio (decoding PCM @ 16 kHz)…");
          appToast.transcribingStarted();
          break;
        case MessageTypes.RESULT:
          // Partial or full chunk results — we replace `output` with the latest full array
          setOutput(e.data.results);
          addLog(
            `✓ Chunk ${e.data.results.length}: “${e.data.results[e.data.results.length - 1]?.text?.trim() ?? ""}”`,
          );
          break;
        case MessageTypes.INFERENCE_DONE:
          // Worker finished all chunks; UI can show export actions
          setFinished(true);
          setLoading(false);
          setDownloading(false);
          addLog(`✨ Transcription complete!`);
          appToast.transcribingDone();
          break;
        case MessageTypes.ERROR:
          // Fatal error in worker (model load, inference, or uncaught exception)
          setTranscriptionError(e.data.error);
          setLoading(false);
          setDownloading(false);
          break;
      }
    };

    const onWorkerError = (e: ErrorEvent) => {
      setTranscriptionError(`Worker error: ${e.message}`);
      setLoading(false);
      setDownloading(false);
    };

    worker.current.addEventListener("message", onMessageReceived);
    worker.current.addEventListener("error", onWorkerError);
    const currentWorker = worker.current;

    return () => {
      currentWorker.removeEventListener("message", onMessageReceived);
      currentWorker.removeEventListener("error", onWorkerError);
    };
  }, [addLog]);

  // ─── Actions ─────────────────────────────────────────────────────────
  // useCallback memoizes functions to prevent unnecessary re-renders
  // of child components that receive these as props

  const handleAudioReset = useCallback(() => {
    setFile(null);
    setAudioStream(null);
    setOutput(null);
    setDownloading(false);
    setDownloadProgress(0);
    setLoading(false);
    setFinished(false);
    setTranscriptionError(null);
    setTranscriptLogs([]);
  }, []);

  /**
   * Reads audio data from a File or Blob and returns a Float32Array
   * suitable for the Whisper model.
   *
   * The AudioContext API decodes the audio file into raw PCM data
   * at a 16kHz sampling rate (required by Whisper models).
   */
  const readAudioFrom = useCallback(
    async (audioSource: File | Blob): Promise<Float32Array> => {
      const samplingRate = 16000;
      const audioCTX = new AudioContext({ sampleRate: samplingRate });
      const response = await audioSource.arrayBuffer();
      const decoded = await audioCTX.decodeAudioData(response);
      // getChannelData(0) extracts the first (mono) audio channel
      const audio = decoded.getChannelData(0);
      return audio;
    },
    [],
  );

  const handleFormSubmission = useCallback(async () => {
    if (!file && !audioStream) return;

    const audioSource = file ?? audioStream;
    if (!audioSource) return;

    // ↓ Immediately switch UI to Transcribing screen before any async work.
    // Without this, there is a race: readAudioFrom is async (PCM decode),
    // so loading stays false during that gap and MainContent re-renders
    // FileDisplay instead of Transcribing.
    setLoading(true);
    setTranscriptionError(null);

    let audio: Float32Array;
    try {
      audio = await readAudioFrom(audioSource);
    } catch (err) {
      setTranscriptionError(`Failed to read audio: ${(err as Error).message}`);
      setLoading(false);
      return;
    }

    // Must match worker's Xenova model id / family — tiny.en = fast English-only
    const modelName = "openai/whisper-tiny.en";

    // Send inference request to the Whisper Web Worker (Float32Array is structured-cloned)
    worker.current?.postMessage({
      type: MessageTypes.INFERENCE_REQUEST,
      audio,
      model_name: modelName,
    });
  }, [file, audioStream, readAudioFrom]);

  // ─── Context Value ───────────────────────────────────────────────────
  // useMemo prevents creating a new context value object on every render,
  // which would cause all consumers to re-render unnecessarily
  const contextValue: TranscriptionContextValue = useMemo(
    () => ({
      file,
      audioStream,
      output,
      downloading,
      downloadProgress,
      loading,
      finished,
      transcriptionError,
      transcriptLogs,
      setFile,
      setAudioStream,
      handleAudioReset,
      handleFormSubmission,
    }),
    [
      file,
      audioStream,
      output,
      downloading,
      downloadProgress,
      loading,
      finished,
      transcriptionError,
      transcriptLogs,
      handleAudioReset,
      handleFormSubmission,
    ],
  );

  // Any descendant can call `useTranscription()` — must stay inside this Provider
  return (
    <TranscriptionContext.Provider value={contextValue}>
      {children}
    </TranscriptionContext.Provider>
  );
}
