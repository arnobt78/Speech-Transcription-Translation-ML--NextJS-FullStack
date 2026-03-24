/**
 * useTranscriptionHistory — Custom Hook for Managing Transcription History
 *
 * Persists past transcription sessions to localStorage, allowing users
 * to review their previous work. This demonstrates:
 * - localStorage integration with React hooks
 * - Lazy initialization of state (reading from storage only once)
 * - Type-safe JSON parsing with validation
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import type { TranscriptionChunk, TranscriptionHistoryEntry } from "@/types";

const STORAGE_KEY = "freescribe-history";
const MAX_HISTORY_ITEMS = 20;

interface UseTranscriptionHistoryReturn {
  /** List of past transcription entries */
  history: TranscriptionHistoryEntry[];
  /** Add a new entry to the history */
  addEntry: (
    fileName: string,
    chunks: TranscriptionChunk[],
    translation?: string,
  ) => void;
  /** Remove an entry by its ID */
  removeEntry: (id: string) => void;
  /** Clear all history entries */
  clearHistory: () => void;
}

export function useTranscriptionHistory(): UseTranscriptionHistoryReturn {
  // Lazy initialization: read from localStorage only on first render
  const [history, setHistory] = useState<TranscriptionHistoryEntry[]>([]);

  // Load history from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TranscriptionHistoryEntry[] = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch {
      // If parsing fails, start with empty history
      setHistory([]);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((entries: TranscriptionHistoryEntry[]) => {
    setHistory(entries);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage might be full or unavailable
      console.warn("Failed to save transcription history to localStorage");
    }
  }, []);

  const addEntry = useCallback(
    (fileName: string, chunks: TranscriptionChunk[], translation?: string) => {
      const newEntry: TranscriptionHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        fileName,
        chunks,
        translation,
      };

      setHistory((prev) => {
        // Cap list size so localStorage stays small and parse stays fast
        const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          console.warn("Failed to save transcription history");
        }
        return updated;
      });
    },
    [],
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((entry) => entry.id !== id);
        saveHistory(updated);
        return updated;
      });
    },
    [saveHistory],
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
