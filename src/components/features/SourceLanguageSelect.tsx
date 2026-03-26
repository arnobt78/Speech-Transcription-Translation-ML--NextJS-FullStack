"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Languages, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WHISPER_SOURCE_LANGUAGES } from "@/data/presets";
import { cn } from "@/lib/utils";

interface SourceLanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export function SourceLanguageSelect({
  value,
  onChange,
  className,
}: SourceLanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 10);
    } else {
      setQuery("");
    }
  }, [open]);

  const selectedLabel = useMemo(
    () =>
      Object.entries(WHISPER_SOURCE_LANGUAGES).find(
        ([, code]) => code === value,
      )?.[0] ?? "English",
    [value],
  );

  const filtered = useMemo(() => {
    const items = Object.entries(WHISPER_SOURCE_LANGUAGES);
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(([name, code]) => {
      const label = `${name} (${code})`.toLowerCase();
      return label.includes(q);
    });
  }, [query]);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-semibold text-slate-600">
            Source language
          </p>
        </div>
        {value !== "en" && (
          <button
            type="button"
            onClick={() => onChange("en")}
            className="text-xs font-semibold text-blue-600 underline-offset-2 transition-colors hover:text-blue-700 cursor-pointer"
          >
            Reset to default
          </button>
        )}
      </div>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition-colors",
            open
              ? "border-blue-400 ring-2 ring-blue-100"
              : "border-slate-200 hover:border-slate-300",
          )}
        >
          <span className="truncate text-slate-700">
            {value ? `${selectedLabel} (${value})` : selectedLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="relative mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="border-b border-slate-100 p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search source language..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-slate-400">
                  {filtered.length} of{" "}
                  {Object.keys(WHISPER_SOURCE_LANGUAGES).length} source
                  languages
                </p>
              </div>
              <div
                role="listbox"
                aria-label="Source languages"
                className="max-h-56 overflow-y-auto py-1"
              >
                {filtered.map(([name, code]) => (
                  <div
                    key={code}
                    role="option"
                    aria-selected={value === code}
                    onClick={() => {
                      onChange(code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors",
                      value === code
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>
                      {name} ({code})
                    </span>
                    {value === code && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
