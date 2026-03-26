/**
 * useTranslateWorker — Custom Hook for Translation via Web Worker
 *
 * Manages the lifecycle of the NLLB translation Web Worker, including:
 * - Lazy instantiation (worker created only when needed)
 * - Message handling (progress, updates, completion)
 * - Cleanup on unmount
 *
 * This hook demonstrates the "Worker Hook" pattern — a common approach
 * for integrating Web Workers with React's component lifecycle.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LANGUAGES } from "@/data/presets";
import { appToast } from "@/lib/toasts";
import type { TranslateWorkerMessage } from "@/types";

interface UseTranslateWorkerReturn {
  /** The current translation output (updates live during translation) */
  translation: string | null;
  /** Whether a translation is currently in progress */
  translating: boolean;
  /** Translation quality mode */
  translationQuality: "fast" | "high";
  /** Selected target language code */
  toLanguage: string;
  /** Set the target language for translation */
  setToLanguage: (lang: string) => void;
  /** Set translation quality mode */
  setTranslationQuality: (quality: "fast" | "high") => void;
  /** Clear translation state */
  setTranslation: (t: string | null) => void;
  /** Set translating state */
  setTranslating: (t: boolean) => void;
  /** Start translating the given text chunks */
  generateTranslation: (textChunks: string[]) => void;
  /** Live log lines from the translation worker */
  translateLogs: string[];
  /** Live token update count (during translation) */
  tokenCount: number;
  /** Final token count preserved after translation completes */
  finalTokenCount: number;
}

export function useTranslateWorker(): UseTranslateWorkerReturn {
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationQuality, setTranslationQuality] = useState<"fast" | "high">(
    "fast",
  );
  const [toLanguage, setToLanguage] = useState("Select language");
  const [translateLogs, setTranslateLogs] = useState<string[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  // Ref mirrors tokenCount so the complete handler can read the final value
  // without a stale closure (state reads inside useEffect callbacks are stale)
  const tokenCountRef = useRef(0);
  const [finalTokenCount, setFinalTokenCount] = useState(0);

  const worker = useRef<Worker | null>(null);

  /** Append a timestamped line to the live log */
  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setTranslateLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  }, []);

  // Initialize translation worker and set up message handling
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL("@/workers/translate.worker.ts", import.meta.url),
        { type: "module" },
      );
    }

    const onMessageReceived = (e: MessageEvent<TranslateWorkerMessage>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = e.data as any;
      switch (data.status) {
        case "initiate": {
          const file =
            (data.file as string | undefined)?.split("/").pop() ??
            "model component";
          addLog(`Loading ${file}…`);
          break;
        }
        case "done": {
          const file =
            (data.file as string | undefined)?.split("/").pop() ?? "component";
          addLog(`✓ ${file} loaded`);
          break;
        }
        case "ready":
          addLog("NLLB-200 pipeline ready — starting translation…");
          break;
        case "progress": {
          const pct = Math.round(data.progress ?? 0);
          const file = (data.file as string | undefined)?.split("/").pop();
          if (pct > 0 && pct % 25 === 0 && file) {
            addLog(`↓ ${file} — ${pct}%`);
          }
          break;
        }
        case "update": {
          setTranslation(data.output);
          tokenCountRef.current += 1;
          setTokenCount((c) => c + 1);
          if (tokenCountRef.current % 8 === 0) {
            const words = (data.output as string).split(" ");
            const preview = words.slice(0, 6).join(" ");
            addLog(
              `⟳ ${tokenCountRef.current} tokens — "${preview}${words.length > 6 ? "…" : ""}"`,
            );
          }
          break;
        }
        case "complete":
          setTranslation(data.output?.[0]?.translation_text ?? null);
          setFinalTokenCount(tokenCountRef.current);
          setTranslating(false);
          addLog(
            `✨ Translation complete — ${tokenCountRef.current} tokens generated.`,
          );
          appToast.translationDone();
          break;
        case "error":
          setTranslating(false);
          addLog(`✖ Translation failed: ${data.error ?? "Unknown error"}`);
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);
    const currentWorker = worker.current;

    return () => {
      currentWorker.removeEventListener("message", onMessageReceived);
    };
  }, [addLog]);

  /**
   * Send text to the translation worker for processing.
   * The worker will send back progress updates and the final result.
   */
  const generateTranslation = useCallback(
    (textChunks: string[]) => {
      if (translating || toLanguage === "Select language") return;

      const langName =
        Object.entries(LANGUAGES).find(
          ([, code]) => code === toLanguage,
        )?.[0] ?? toLanguage;

      setTranslating(true);
      setTranslateLogs([]);
      setTokenCount(0);
      tokenCountRef.current = 0;
      setFinalTokenCount(0);
      addLog(`Starting translation → ${langName} (${translationQuality})…`);
      appToast.translationStarted(langName);
      // Whisper output is English in this app build — NLLB source fixed to Latin English
      worker.current?.postMessage({
        text: textChunks,
        src_lang: "eng_Latn",
        tgt_lang: toLanguage,
        quality_mode: translationQuality,
      });
    },
    [translating, toLanguage, addLog, translationQuality],
  );

  return {
    translation,
    translating,
    translationQuality,
    toLanguage,
    setToLanguage,
    setTranslationQuality,
    setTranslation,
    setTranslating,
    generateTranslation,
    translateLogs,
    tokenCount,
    finalTokenCount,
  };
}
