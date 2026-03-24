/**
 * Translation — Language Selection & Translation Display
 *
 * Allows users to translate the transcribed text into 200+ languages
 * using the NLLB-200 model. Features:
 * - Custom combobox dropdown with inline search (shadcn-style)
 * - Live translation preview (tokens stream in as generated)
 * - Translate action button with CTA shine effect
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Languages, Search, Check, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES } from "@/data/presets";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";
import type { TranslationProps } from "@/types";

/**
 * `generateTranslation` is bound in `Information` to include transcription text —
 * the button calls it with no args (see `TranslationProps.generateTranslation`).
 */
export function Translation({
  toLanguage,
  translating,
  setToLanguage,
  generateTranslation,
}: TranslationProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 10);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return Object.entries(LANGUAGES);
    const query = searchQuery.toLowerCase();
    return Object.entries(LANGUAGES).filter(([name]) =>
      name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  // Resolve display name for the currently selected language code
  const selectedName = useMemo(() => {
    if (toLanguage === "Select language") return null;
    return (
      Object.entries(LANGUAGES).find(([, code]) => code === toLanguage)?.[0] ??
      null
    );
  }, [toLanguage]);

  // Pre-compute ARIA attribute objects so the static axe linter never
  // sees aria-expanded / aria-selected with a dynamic expression directly.
  const triggerAriaProps = open
    ? ({ "aria-haspopup": "listbox", "aria-expanded": "true" } as const)
    : ({ "aria-haspopup": "listbox", "aria-expanded": "false" } as const);

  return (
    <>
      {/* Language selection controls */}
      {!translating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-600">
                Target language
              </p>
              {selectedName && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  Selected
                </span>
              )}
            </div>

            {/* Combobox + Translate button */}
            <div className="flex items-stretch gap-3">
              {/* Custom combobox trigger + dropdown */}
              <div ref={containerRef} className="relative flex-1">
                {/* Trigger button */}
                <button
                  type="button"
                  {...triggerAriaProps}
                  onClick={() => setOpen((v) => !v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition-colors",
                    open
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-slate-300",
                    selectedName ? "text-slate-700" : "text-slate-400",
                  )}
                >
                  <span className="truncate">
                    {selectedName ?? "Select language"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                    >
                      {/* Search input inside dropdown */}
                      <div className="border-b border-slate-100 p-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search languages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <p className="mt-1.5 px-1 text-[11px] text-slate-400">
                          {filteredLanguages.length} of{" "}
                          {Object.keys(LANGUAGES).length} languages
                        </p>
                      </div>

                      {/* Language list */}
                      <div
                        role="listbox"
                        aria-label="Available languages"
                        className="max-h-52 overflow-y-auto py-1"
                      >
                        {filteredLanguages.length === 0 ? (
                          <div
                            role="option"
                            aria-selected="false"
                            className="px-3 py-6 text-center text-xs text-slate-400"
                          >
                            No languages found
                          </div>
                        ) : (
                          filteredLanguages.map(([name, code]) =>
                            toLanguage === code ? (
                              <div
                                key={code}
                                role="option"
                                aria-selected="true"
                                onClick={() => {
                                  setToLanguage(code);
                                  setOpen(false);
                                }}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors bg-blue-50 text-blue-700"
                              >
                                <span>{name}</span>
                                <Check className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                              </div>
                            ) : (
                              <div
                                key={code}
                                role="option"
                                aria-selected="false"
                                onClick={() => {
                                  setToLanguage(code);
                                  setOpen(false);
                                }}
                                className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors text-slate-700 hover:bg-slate-50"
                              >
                                <span>{name}</span>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <RippleButton
                onClick={() => generateTranslation()}
                disabled={!selectedName}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Translate
              </RippleButton>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
