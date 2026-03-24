/**
 * HomePage — Main Landing Page (Client-Side Rendered)
 *
 * This is the primary entry point where users can either:
 * 1. Record audio from their microphone
 * 2. Upload an audio file (MP3, WAV, WebM)
 * 3. Drag & drop an audio file
 *
 * Architecture note:
 * This component is rendered client-side ("use client") because it uses:
 * - Browser APIs (MediaRecorder, FileReader, drag & drop)
 * - React hooks (useState, useCallback)
 * - Event handlers
 *
 * The SSR page (app/page.tsx) imports this as a client component,
 * keeping the page itself as a Server Component for faster initial load.
 *
 * Enhanced features over original:
 * - Drag & drop file upload with visual drop zone
 * - Recording duration timer
 * - File type validation with user feedback
 * - Framer Motion entrance animations
 */

"use client";

import { useState, useCallback } from "react";
import {
  Mic,
  Upload,
  FileAudio,
  Clock,
  Wand2,
  Languages,
  Zap,
  MicOff,
  X,
} from "lucide-react";
import { useTranscription } from "@/context/TranscriptionContext";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { motion } from "framer-motion";
import { RippleButton } from "@/components/ui/ripple-button";
import { Badge } from "@/components/ui/badge";
import { appToast } from "@/lib/toasts";

// Browser file picker filter — still validate server-side if you ever add uploads API
const ACCEPTED_AUDIO_TYPES = ".mp3,.wav,.wave,.webm,.ogg,.m4a,.flac";

const STEPS = [
  {
    icon: Mic,
    title: "Record",
    titleColor: "text-blue-600",
    desc: "Capture audio from your microphone",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    cardBorder: "border-blue-400/30",
    cardGradient: "from-blue-500/20 via-blue-500/10 to-blue-500/5",
    cardShadow: "shadow-[0_20px_50px_rgba(59,130,246,0.2)]",
  },
  {
    icon: Wand2,
    title: "Transcribe",
    titleColor: "text-violet-600",
    desc: "AI-powered via OpenAI Whisper",
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    cardBorder: "border-violet-400/30",
    cardGradient: "from-violet-500/20 via-violet-500/10 to-violet-500/5",
    cardShadow: "shadow-[0_20px_50px_rgba(139,92,246,0.2)]",
  },
  {
    icon: Languages,
    title: "Translate",
    titleColor: "text-emerald-600",
    desc: "Into 200+ languages with NLLB-200",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    cardBorder: "border-emerald-400/30",
    cardGradient: "from-emerald-500/20 via-emerald-500/10 to-emerald-500/5",
    cardShadow: "shadow-[0_20px_50px_rgba(16,185,129,0.2)]",
  },
];

export function HomePage() {
  const { setFile, setAudioStream } = useTranscription();
  const [isDragOver, setIsDragOver] = useState(false);

  // Custom hook handles all MediaRecorder logic
  const {
    recordingStatus,
    duration,
    micError,
    clearMicError,
    startRecording,
    stopRecording,
  } = useMediaRecorder((blob: Blob) => {
    setAudioStream(blob);
  });

  const isRecording = recordingStatus === "recording";

  /** Format seconds into MM:SS display */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /** Handle file selection from the file input */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    [setFile],
  );

  /** Handle files dropped onto the drop zone */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("audio/")) {
        setFile(droppedFile);
      }
    },
    [setFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-8">
      {/* ── Hero ── */}
      <div className="flex flex-col items-center gap-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
            <Zap className="h-3 w-3" />
            Runs 100% in your browser · No data sent to servers
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="font-bold text-4xl tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Free
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Scribe
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <p className="max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            Record or upload audio, transcribe with Machine Learning Web Worker
            AI, and translate into 200+ languages — all free, all local.
          </p>
        </motion.div>
      </div>

      {/* ── Step cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-5xl"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map(
            (
              {
                icon: Icon,
                title,
                titleColor,
                desc,
                iconColor,
                iconBg,
                cardBorder,
                cardGradient,
                cardShadow,
              },
              i,
            ) => (
              <div
                key={title}
                className={`group flex flex-col items-center gap-4 rounded-2xl border p-6 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBorder} ${cardGradient} ${cardShadow}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} ring-4 ring-white/60`}
                >
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-300">
                      0{i + 1}
                    </span>
                    <span className={`font-semibold ${titleColor}`}>
                      {title}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </motion.div>

      {/* ── Mic Error Banner ── */}
      {micError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="w-full max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <MicOff className="h-4 w-4 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-700">
                Microphone Access Required
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-600">
                {micError}
              </p>
            </div>
            <button
              onClick={clearMicError}
              className="shrink-0 rounded-lg p-1 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Record CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-col items-center gap-4 w-full max-w-sm"
      >
        <div
          className={`w-full rounded-2xl${!isRecording ? " cta-shine-wrap" : ""}`}
        >
          <RippleButton
            onClick={
              isRecording
                ? () => {
                    stopRecording();
                    appToast.recordingStopped();
                  }
                : () => {
                    startRecording();
                    appToast.recordingStarted();
                  }
            }
            className={`cta-shine-button relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 ${
              isRecording
                ? "bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/40"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/40"
            }`}
          >
            <span>{isRecording ? "Stop Recording" : "Start Recording"}</span>
            <div className="flex items-center gap-2">
              {isRecording && duration > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 bg-white/20 text-white border-white/30 text-xs"
                >
                  <Clock className="h-3 w-3" />
                  {formatDuration(duration)}
                </Badge>
              )}
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Mic
                  className={`h-4 w-4 text-white ${isRecording ? "animate-pulse" : ""}`}
                />
              </div>
            </div>
          </RippleButton>
        </div>

        <p className="text-sm text-slate-500">
          or{" "}
          <label className="cursor-pointer font-semibold text-blue-500 underline-offset-2 hover:underline transition-colors">
            browse a file
            <input
              onChange={handleFileChange}
              className="hidden"
              type="file"
              accept={ACCEPTED_AUDIO_TYPES}
            />
          </label>{" "}
          an audio file
        </p>
      </motion.div>

      {/* ── Drag & Drop Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-7xl"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-10 transition-all duration-200 ${
            isDragOver
              ? "scale-[1.02] border-blue-400 bg-blue-50"
              : "border-slate-200 bg-white/60 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          {isDragOver ? (
            <Upload className="h-10 w-10 animate-bounce text-blue-500" />
          ) : (
            <FileAudio className="h-10 w-10 text-slate-300" />
          )}
          <p className="text-sm font-medium text-slate-400">
            {isDragOver
              ? "Drop your audio file here"
              : "Drag & drop audio file here"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["MP3", "WAV", "WebM", "OGG", "M4A", "FLAC"].map((fmt) => (
              <span
                key={fmt}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-sm italic text-slate-400"
      >
        Free now, free forever.
      </motion.p>
    </main>
  );
}
