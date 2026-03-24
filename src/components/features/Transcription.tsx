/**
 * Transcription — Display Transcribed Text Results
 *
 * Renders the transcription output as timestamped cards.
 * Each chunk of transcribed audio is displayed with its start/end times,
 * making it easy for users to navigate the transcription.
 *
 * Enhanced features:
 * - Timestamped display with formatted times
 * - Individual chunk cards with framer-motion animation
 * - Chunk index badges
 * - Empty state message
 */

"use client";

import { Clock } from "lucide-react";
import { AnimatedContainer } from "@/components/ui/animated-container";
import type { TranscriptionChunk } from "@/types";

interface TranscriptionProps {
  textElement: string[];
  output?: TranscriptionChunk[];
}

/** Format seconds into human-readable time (e.g., "1:30") */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Transcription({ textElement, output }: TranscriptionProps) {
  // If we have detailed output with timestamps, show individual chunks
  if (output && output.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        {/* `chunk.index` is the ASR segment index from the worker; `idx` only offsets animation stagger */}
        {output.map((chunk, idx) => (
          <AnimatedContainer
            key={chunk.index}
            direction="bottom"
            delay={idx * 0.05}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
                  #{chunk.index + 1}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(chunk.start)} – {formatTime(chunk.end)}
                  </span>
                </div>
              </div>
              <p className="text-left text-slate-700 leading-relaxed">
                {chunk.text}
              </p>
            </div>
          </AnimatedContainer>
        ))}
      </div>
    );
  }

  // Fallback: display plain text without timestamps
  if (textElement.length > 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-left text-slate-700 leading-relaxed">
          {textElement.join(" ")}
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm italic text-slate-400">
      No transcription available yet.
    </p>
  );
}
