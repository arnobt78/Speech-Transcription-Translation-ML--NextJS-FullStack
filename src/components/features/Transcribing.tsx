/**
 * Transcribing — Loading State During ML Model Processing
 *
 * Shown while the Whisper model is downloading and/or processing audio.
 * Features:
 * - Download progress percentage (enhanced over original)
 * - Animated loading bars
 * - Status messages indicating current stage
 *
 * This component is a presentational (or "dumb") component — it receives
 * all its data via props and has no internal state or side effects.
 */

"use client";

import { useRef, useEffect } from "react";
import { Download, Cpu, Sparkles, AlertTriangle, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranscription } from "@/context/TranscriptionContext";
import type { TranscribingProps } from "@/types";

export function Transcribing({
  downloading,
  downloadProgress,
  error,
}: TranscribingProps) {
  const { handleAudioReset, transcriptLogs } = useTranscription();
  const StageIcon = downloading ? Download : Cpu;
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    progressBarRef.current?.style.setProperty(
      "--progress",
      `${Math.min(downloadProgress, 100)}%`,
    );
  }, [downloadProgress]);

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-xl shadow-rose-400/30">
            <AlertTriangle className="h-9 w-9 text-white" />
          </div>
          <h1 className="font-bold text-3xl tracking-tight text-slate-900">
            Transcription Failed
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-500">
            {error}
          </p>
          <button
            type="button"
            onClick={handleAudioReset}
            className="mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 animate-float">
          <Sparkles className="h-9 w-9 text-white" />
        </div>
        <h1 className="font-bold text-4xl tracking-tight text-slate-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Transcribing
          </span>
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
          <StageIcon className="h-3.5 w-3.5 animate-pulse text-blue-500" />
          <p className="text-xs font-semibold text-blue-600">
            {downloading
              ? "Downloading AI model..."
              : "Processing your audio..."}
          </p>
        </div>
      </motion.div>

      {/* Progress card */}
      {downloading && downloadProgress > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-7xl"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Model download
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-600">
                {Math.round(downloadProgress)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                ref={progressBarRef}
                className="progress-bar-fill h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Cached locally after first download.
            </p>
          </div>
        </motion.div>
      )}

      {/* Animated dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400 ${i === 1 ? "[animation-delay:200ms]" : i === 2 ? "[animation-delay:400ms]" : ""}`}
          />
        ))}
      </motion.div>

      {/* Live activity log */}
      <AnimatePresence>
        {transcriptLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-7xl"
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Live activity
                </span>
                <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {transcriptLogs.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-[11px] leading-relaxed text-slate-300"
                  >
                    {line}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
