/**
 * FileDisplay — Audio File Preview & Transcription Trigger
 *
 * Displays the uploaded/recorded audio file with:
 * - File name display
 * - Audio player for previewing the audio
 * - Model selection dropdown (enhanced feature)
 * - Reset and Transcribe action buttons
 *
 * This component demonstrates:
 * - `useRef` for accessing DOM elements (audio player)
 * - `useEffect` for syncing state with DOM (setting audio source)
 * - URL.createObjectURL for creating playable URLs from File/Blob objects
 */

"use client";

import { useRef, useEffect } from "react";
import { PenLine, RotateCcw, FileAudio, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { RippleButton } from "@/components/ui/ripple-button";
import type { FileDisplayProps } from "@/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileDisplay({
  handleAudioReset,
  file,
  audioStream,
  handleFormSubmission,
}: FileDisplayProps) {
  // useRef gives us a direct reference to the <audio> DOM element
  // so we can set its src programmatically
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync the audio source whenever the file or stream changes
  useEffect(() => {
    if (!file && !audioStream) return;

    const audioSource = file ?? audioStream;
    if (audioSource && audioRef.current) {
      // URL.createObjectURL creates a temporary URL that represents
      // the file/blob in memory — the browser can play it like a regular URL
      audioRef.current.src = URL.createObjectURL(audioSource);
    }
  }, [audioStream, file]);

  const isRecording = !file && !!audioStream;
  const fileName = file?.name ?? "Custom audio recording";
  const fileSize = file ? formatFileSize(file.size) : null;
  const fileExt = file?.name.split(".").pop()?.toUpperCase() ?? "REC";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="text-center"
      >
        <h1 className="font-bold text-4xl tracking-tight text-slate-900 sm:text-5xl">
          Your{" "}
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Audio
          </span>
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-7xl mx-auto leading-relaxed">
          Preview your {isRecording ? "recording" : "audio file"} below. Hit{" "}
          <span className="font-semibold text-blue-600">Transcribe</span> when
          you&apos;re ready — or{" "}
          <span className="font-semibold text-slate-600">Reset</span> to start
          over.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-7xl"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* File header */}
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isRecording
                  ? "bg-rose-100 text-rose-500"
                  : "bg-blue-100 text-blue-500"
              }`}
            >
              {isRecording ? (
                <Mic className="h-5 w-5" />
              ) : (
                <FileAudio className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-800">
                {fileName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                  {fileExt}
                </span>
                {fileSize && (
                  <span className="text-xs text-slate-400">{fileSize}</span>
                )}
              </div>
            </div>
          </div>

          {/* Audio player */}
          <div className="px-6 py-5">
            <audio ref={audioRef} className="w-full rounded-xl" controls>
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <RippleButton
              onClick={handleAudioReset}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </RippleButton>

            <RippleButton
              onClick={handleFormSubmission}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <PenLine className="h-4 w-4" />
              <span>Transcribe</span>
            </RippleButton>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
