/**
 * Information — Transcription & Translation Results Container
 *
 * This is the main results view that appears after transcription completes.
 * It provides:
 * - Tabbed interface switching between Transcription and Translation views
 * - Copy to clipboard functionality
 * - Download in multiple formats (TXT, SRT, VTT)
 * - Translation worker management via custom hook
 *
 * Architecture patterns demonstrated:
 * - Composition: Uses child components (Transcription, Translation) for each tab
 * - Custom hooks: useTranslateWorker encapsulates worker logic
 * - Derived state: textElement is computed from output + active tab
 * - Multiple export formats using utility functions
 */

"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  Download,
  Loader2,
  Languages,
  FileText,
  FileType,
  Captions,
  Terminal,
  Globe,
  Sparkles,
  Mic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslateWorker } from "@/hooks/useTranslateWorker";
import { useTranscription } from "@/context/TranscriptionContext";
import { LANGUAGES } from "@/data/presets";
import { Transcription } from "@/components/features/Transcription";
import { Translation } from "@/components/features/Translation";
import { RippleButton } from "@/components/ui/ripple-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  InformationProps,
  TranscriptionChunk,
  ExportFormat,
} from "@/types";

// ─── Export Format Utilities ────────────────────────────────────────────────

// ─── Subtitle export helpers (SRT/VTT) — pure functions, easy to unit test ───

/** Format seconds for SRT timestamps (HH:MM:SS,mmm) */
function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},000`;
}

/** Format seconds for VTT timestamps (HH:MM:SS.mmm) */
function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.000`;
}

/** Generate SRT formatted subtitle file content */
function generateSrt(chunks: TranscriptionChunk[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `${i + 1}\n${formatSrtTime(chunk.start)} --> ${formatSrtTime(chunk.end)}\n${chunk.text.trim()}\n`,
    )
    .join("\n");
}

/** Generate WebVTT formatted subtitle file content */
function generateVtt(chunks: TranscriptionChunk[]): string {
  const cues = chunks
    .map(
      (chunk) =>
        `${formatVttTime(chunk.start)} --> ${formatVttTime(chunk.end)}\n${chunk.text.trim()}\n`,
    )
    .join("\n");
  return `WEBVTT\n\n${cues}`;
}

export function Information({ output, finished }: InformationProps) {
  // Custom hook manages the translation worker lifecycle
  const {
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
  } = useTranslateWorker();

  const { detectedLanguage } = useTranscription();

  // Resolve detected language full name via Intl.DisplayNames
  const detectedLanguageName = useMemo(() => {
    if (!detectedLanguage) return null;
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "language" }).of(
          detectedLanguage,
        ) ?? detectedLanguage
      );
    } catch {
      return detectedLanguage;
    }
  }, [detectedLanguage]);

  // Resolve selected language display name
  const selectedLangName = useMemo(
    () =>
      Object.entries(LANGUAGES).find(([, code]) => code === toLanguage)?.[0] ??
      null,
    [toLanguage],
  );

  // Copy-with-feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCopy = useCallback((key: string, text: string) => {
    navigator.clipboard.writeText(text);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopiedKey(key);
    copyTimeoutRef.current = setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Auto-scroll log panels to bottom
  const transcriptLogRef = useRef<HTMLDivElement>(null);
  const translateLogRef = useRef<HTMLDivElement>(null);
  // Intentionally no dependency array: follow new log lines on every paint while streaming
  useEffect(() => {
    if (transcriptLogRef.current) {
      transcriptLogRef.current.scrollTop =
        transcriptLogRef.current.scrollHeight;
    }
  });
  useEffect(() => {
    if (translateLogRef.current) {
      translateLogRef.current.scrollTop = translateLogRef.current.scrollHeight;
    }
  });

  // Elapsed time counter while translation is running
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    if (!translating) {
      setElapsedTime(0);
      return;
    }
    setElapsedTime(0);
    const timerId = setInterval(() => setElapsedTime((s) => s + 1), 1000);
    return () => clearInterval(timerId);
  }, [translating]);

  // Derive the text content based on which tab is showing
  const transcriptionText = useMemo(
    () => output.map((val) => val.text),
    [output],
  );

  /** Copy current content to the system clipboard */
  const handleCopy = useCallback(
    (tab: string) => {
      const text =
        tab === "transcription"
          ? transcriptionText.join(" ")
          : (translation ?? "");
      triggerCopy(tab, text);
    },
    [transcriptionText, translation, triggerCopy],
  );

  /** Download content in the specified format */
  const handleDownload = useCallback(
    (format: ExportFormat, tab: string) => {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (tab === "translation" || format === "txt") {
        content =
          tab === "transcription"
            ? transcriptionText.join(" ")
            : (translation ?? "");
        mimeType = "text/plain";
        extension = "txt";
      } else if (format === "srt") {
        content = generateSrt(output);
        mimeType = "text/plain";
        extension = "srt";
      } else {
        content = generateVtt(output);
        mimeType = "text/vtt";
        extension = "vtt";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.href = url;
      element.download = `FreeScribe_${new Date().toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(element);
      element.click();
      element.remove();
      URL.revokeObjectURL(url);
    },
    [output, transcriptionText, translation],
  );

  // Wraps hook's `generateTranslation(string[])` so `Translation` UI can use a zero-arg handler
  const handleGenerateTranslation = useCallback(() => {
    generateTranslation(transcriptionText);
  }, [generateTranslation, transcriptionText]);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center"
      >
        <h1 className="text-center font-bold text-4xl tracking-tight text-slate-900 sm:text-5xl">
          Your{" "}
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Transcription
          </span>
        </h1>
        <p className="mt-3 text-base text-slate-500 max-w-7xl mx-auto leading-relaxed">
          Transcribed by{" "}
          <span className="font-semibold text-violet-600">Whisper AI</span> —
          review each timestamped chunk below, then switch to the{" "}
          <span className="font-semibold text-emerald-600">Translation</span>{" "}
          tab to convert into 200+ languages with{" "}
          <span className="font-semibold text-blue-600">Meta NLLB-200</span>.
        </p>
        {/* Detected language badge */}
        {detectedLanguageName && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5"
          >
            <Mic className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
              Detected audio language:
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <Globe className="h-3 w-3" />
              {detectedLanguageName}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-7xl"
      >
        <Tabs defaultValue="transcription" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
              <TabsTrigger value="translation">Translation</TabsTrigger>
            </TabsList>
          </div>

          {/* Transcription Tab Content */}
          <TabsContent value="transcription">
            <div className="flex flex-col gap-5">
              {!finished && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              )}

              <Transcription textElement={transcriptionText} output={output} />

              {finished && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <RippleButton
                      onClick={() => handleCopy("transcription")}
                      title={
                        copiedKey === "transcription"
                          ? "Copied!"
                          : "Copy to clipboard"
                      }
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
                        copiedKey === "transcription"
                          ? "bg-emerald-500 text-white shadow-emerald-400/30"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700"
                      }`}
                    >
                      {copiedKey === "transcription" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>
                        {copiedKey === "transcription" ? "Copied!" : "Copy"}
                      </span>
                    </RippleButton>
                    <RippleButton
                      onClick={() => handleDownload("txt", "transcription")}
                      title="Download as TXT"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    >
                      <FileText className="h-4 w-4" />
                      <span>TXT</span>
                    </RippleButton>
                    <RippleButton
                      onClick={() => handleDownload("srt", "transcription")}
                      title="Download as SRT subtitles"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    >
                      <Captions className="h-4 w-4" />
                      <span>SRT</span>
                    </RippleButton>
                    <RippleButton
                      onClick={() => handleDownload("vtt", "transcription")}
                      title="Download as VTT subtitles"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                    >
                      <FileType className="h-4 w-4" />
                      <span>VTT</span>
                    </RippleButton>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border border-slate-200 bg-slate-100 text-slate-500 text-xs"
                  >
                    {output.length} chunk{output.length !== 1 ? "s" : ""}{" "}
                    transcribed
                  </Badge>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Translation Tab Content */}
          <TabsContent value="translation">
            <div className="flex flex-col gap-5">
              {/* Source transcription — always visible as reference */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3"
              >
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <FileText className="h-3 w-3" />
                  Source transcription
                </p>
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {transcriptionText.join(" ")}
                </p>
              </motion.div>

              {/* In-progress translation feedback */}
              <AnimatePresence>
                {translating && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"
                  >
                    {/* Animated indeterminate progress bar */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                      <motion.div
                        className="absolute h-full w-2/5 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <Languages className="h-3.5 w-3.5 animate-pulse" />
                        Generating translation…
                      </span>
                      <span className="tabular-nums text-xs text-slate-400">
                        {tokenCount} tokens · {elapsedTime}s
                      </span>
                    </div>
                    {/* ChatGPT-style streaming text */}
                    {translation ? (
                      <div className="rounded-lg bg-white/80 px-3 py-2.5 shadow-sm ring-1 ring-emerald-100">
                        <p className="text-sm leading-relaxed text-slate-700">
                          {translation}
                          <motion.span
                            className="ml-0.5 inline-block h-[1em] w-0.5 rounded-full bg-emerald-500 align-middle"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity }}
                          />
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Loading translation model — tokens will stream here as
                        they generate.
                      </p>
                    )}
                    {/* Live activity log */}
                    <AnimatePresence>
                      {translateLogs.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-3"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Terminal className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                              Activity log
                            </span>
                            <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          </div>
                          <div
                            ref={translateLogRef}
                            className="flex max-h-32 flex-col gap-0.5 overflow-y-auto"
                          >
                            {translateLogs.map((line, i) => (
                              <motion.p
                                key={i}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                                className="font-mono text-[10px] leading-relaxed text-slate-300"
                              >
                                {line}
                              </motion.p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completed translation card */}
              <AnimatePresence>
                {translation && !translating && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md"
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 shadow-sm">
                          <Globe className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Translation result
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedLangName ?? toLanguage}
                          </p>
                        </div>
                      </div>
                      {/* Top-right action icons */}
                      <div className="flex items-center gap-1.5">
                        <RippleButton
                          onClick={() => handleCopy("translation")}
                          title={
                            copiedKey === "translation"
                              ? "Copied!"
                              : "Copy to clipboard"
                          }
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                            copiedKey === "translation"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          {copiedKey === "translation" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {copiedKey === "translation" ? "Copied!" : "Copy"}
                          </span>
                        </RippleButton>
                        <RippleButton
                          onClick={() => handleDownload("txt", "translation")}
                          title="Download as TXT"
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </RippleButton>
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="px-5 py-4">
                      <p className="text-base leading-relaxed text-slate-800">
                        {translation}
                      </p>
                    </div>
                    {/* Card footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        Powered by Meta NLLB-200
                        {finalTokenCount > 0 && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                            {finalTokenCount} tokens
                          </span>
                        )}
                      </span>
                      <RippleButton
                        onClick={() => {
                          setTranslation(null);
                          setTranslating(false);
                        }}
                        className="text-[11px] text-slate-400 underline-offset-2 transition-colors hover:text-rose-500 hover:underline"
                      >
                        Clear
                      </RippleButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Language selector + translate button */}
              <Translation
                output={output}
                finished={finished}
                toLanguage={toLanguage}
                translating={translating}
                translationQuality={translationQuality}
                setToLanguage={setToLanguage}
                setTranslationQuality={setTranslationQuality}
                generateTranslation={handleGenerateTranslation}
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
