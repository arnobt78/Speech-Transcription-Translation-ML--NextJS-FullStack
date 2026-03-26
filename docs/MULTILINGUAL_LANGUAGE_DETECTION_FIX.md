# Multilingual Language Detection — Handoff Doc for Cursor

## Project Overview

**FreeScribe** — Next.js 15 (App Router, Turbopack) + TypeScript speech-to-text app.

- ML inference runs in a **Web Worker** (`src/workers/whisper.worker.ts`) via `@huggingface/transformers` v3
- Main thread communicates with the worker via `postMessage` / `addEventListener('message')`
- Model: `Xenova/whisper-tiny` (multilingual, q8 quantized, ~40 MB, ONNX)
- State managed via React Context in `src/providers/AppProvider.tsx`

---

## The Problem (Still Not Fixed)

Despite recent code changes, the browser console still shows:

```
whisper.worker.ts:116 No language specified - defaulting to English (en).
```

Result: **non-English audio (Bengali, German, etc.) always transcribes as English text**, and the "Detected audio language" badge shows `Auto-detected` instead of the actual language.

---

## What Has Been Tried (Do NOT Repeat These)

### 1. Swapped model from English-only to multilingual ✅ (code is correct)

- **File:** `src/workers/whisper.worker.ts`, line ~34
- Changed `static model = "Xenova/whisper-tiny.en"` → `"Xenova/whisper-tiny"`
- The model constant is correct now. Do not change it.

### 2. Added `task: "transcribe"` to pipeline call ✅ (code is correct)

- **File:** `src/workers/whisper.worker.ts`, lines ~116–128
- Prevents the model from defaulting to translation mode (which always outputs English)
- Still present and correct. Do not remove it.

### 3. Added `language: null` to pipeline call ✅ (code is correct, but NOT working)

- **File:** `src/workers/whisper.worker.ts`, line ~122
- Intended to signal "auto-detect language", but `null` appears to be treated the same as `undefined` by transformers.js v3 — both trigger the "defaulting to English" warning

### 4. detectedLanguage state flow ✅ (code is correct)

- Worker posts `detectedLanguage` in `INFERENCE_DONE` message
- `AppProvider.tsx` reads it and sets state
- `Information.tsx` reads it from context and shows badge
- The badge shows "Auto-detected" because `raw.language` is never returned (the model defaults to English before even running auto-detect)

---

## Root Cause Analysis

There are **two separate problems**, likely both caused by the same underlying issue:

### Problem A — Old model still cached in IndexedDB

`Xenova/whisper-tiny.en` (English-only) may still be stored in **IndexedDB** from a previous session. transformers.js v3 caches ONNX model files in IndexedDB (not Cache Storage). The browser DevTools showed 43.6 MB in "Cache storage" — but that is the **Next.js app cache**, not the ML model.

**How to verify:** Open browser DevTools → Application → IndexedDB → look for a `transformers-cache` or `hf-transformers` entry. If it has `whisper-tiny.en` files, the old model is still there.

**Fix for Problem A:** The user must clear IndexedDB manually:

1. DevTools → Application → Storage → ✅ check "IndexedDB" → click "Clear site data"
2. OR right-click the IndexedDB entry in the tree → Delete

### Problem B — `language: null` does not enable auto-detection in transformers.js v3

Even after clearing the cache, `language: null` may not work. In transformers.js v3, passing `null` for `language` is possibly treated identically to `undefined` — both result in the "No language specified — defaulting to English" warning.

---

## The Fix to Implement

### Step 1 — Force clear the cached model (user action required)

Tell the user to:

1. Open DevTools → Application tab → Storage section
2. Under "Storage", make sure **IndexedDB** ✅ is checked (in addition to Cache Storage, Cookies, etc.)
3. Click **"Clear site data"**
4. Hard reload the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Step 2 — Fix language auto-detection in the worker

**File:** `src/workers/whisper.worker.ts`

The pipeline call currently looks like this (around line 116–128):

```ts
pipelineResult = await (pipelineInstance as any)(audio, {
  top_k: 0,
  do_sample: false,
  chunk_length_s: 30,
  stride_length_s: strideLengthS,
  return_timestamps: true,
  task: "transcribe",
  language: null, // ← THIS IS NOT WORKING
  callback_function: ...,
  chunk_callback: ...,
});
```

**Replace it with one of these approaches (try in order):**

#### Option A — Remove `language` entirely (most likely fix)

```ts
pipelineResult = await (pipelineInstance as any)(audio, {
  top_k: 0,
  do_sample: false,
  chunk_length_s: 30,
  stride_length_s: strideLengthS,
  return_timestamps: true,
  task: "transcribe",
  // no language field at all — let transformers.js v3 handle auto-detection
  callback_function: generationTracker.callbackFunction.bind(generationTracker),
  chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
});
```

Wait — the warning says "No language specified" which IS the auto-detect path in some versions. This may actually be fine and the real fix is just clearing IndexedDB.

#### Option B — Use `language: undefined` explicitly

Same as omitting it, but makes intent clear:

```ts
language: undefined,
```

#### Option C — Use `forced_decoder_ids: null` to override any hardcoded language token

```ts
pipelineResult = await (pipelineInstance as any)(audio, {
  top_k: 0,
  do_sample: false,
  chunk_length_s: 30,
  stride_length_s: strideLengthS,
  return_timestamps: true,
  task: "transcribe",
  forced_decoder_ids: null,
  callback_function: generationTracker.callbackFunction.bind(generationTracker),
  chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
});
```

### Step 3 — Extract detected language from transformers.js v3 result

**File:** `src/workers/whisper.worker.ts`, method `sendFinalResult` in `GenerationTracker` class (around line 220–260)

The current code tries:

```ts
detectedLanguage =
  raw.language ?? raw.detected_language ?? raw.language_code ?? null;
```

In transformers.js v3, the detected language is NOT in the top-level result object. It is embedded in the **special tokens** of the output. To extract it properly:

```ts
// transformers.js v3: language token is in raw.chunks[0]?.tokens or raw.language
// Try all known locations:
detectedLanguage =
  raw?.language ??
  raw?.chunks?.[0]?.language ??
  (raw?.text?.match(/<\|([a-z]{2,3})\|>/) ?? [])[1] ??
  null;
```

The `<|de|>` style language tokens appear in the raw output text when `return_timestamps: true` and the model is multilingual. Parsing them from the text is a reliable fallback.

---

## File Map — What Each File Does

| File                                      | Role                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/workers/whisper.worker.ts`           | Web Worker — runs Whisper ASR inference. All ML code is here.                                    |
| `src/providers/AppProvider.tsx`           | Root React provider — manages worker lifecycle, receives messages, holds all transcription state |
| `src/context/TranscriptionContext.tsx`    | TypeScript interface for the context + `useTranscription()` hook                                 |
| `src/types/index.ts`                      | All shared TypeScript types including `WhisperWorkerMessage` discriminated union                 |
| `src/components/features/Information.tsx` | Results page — shows transcription chunks, translation tab, detected language badge              |
| `src/components/pages/HomePage.tsx`       | Landing page — record button, file upload, info note                                             |
| `src/data/presets.ts`                     | Constants: `MessageTypes` enum, `LANGUAGES` map for NLLB-200                                     |

---

## detectedLanguage Data Flow

```
whisper.worker.ts
  sendFinalResult(pipelineResult)
    → extracts raw.language (or parses from tokens)
    → self.postMessage({ type: INFERENCE_DONE, detectedLanguage: "de" })

AppProvider.tsx
  case MessageTypes.INFERENCE_DONE:
    → setDetectedLanguage(e.data.detectedLanguage ?? "auto")

TranscriptionContext.tsx
  → detectedLanguage: string | null  (in context interface)

Information.tsx
  const { detectedLanguage } = useTranscription()
  → Intl.DisplayNames resolves "de" → "German"
  → Badge renders: "Detected audio language: 🌐 German"
```

---

## Current State of Key Code

### whisper.worker.ts — pipeline call (lines ~116–128)

```ts
pipelineResult = await (pipelineInstance as any)(audio, {
  top_k: 0,
  do_sample: false,
  chunk_length_s: 30,
  stride_length_s: strideLengthS,
  return_timestamps: true,
  task: "transcribe",
  language: null, // ← not working, needs fix
  callback_function: generationTracker.callbackFunction.bind(generationTracker),
  chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
});
```

### whisper.worker.ts — language extraction (in sendFinalResult, ~line 235)

```ts
detectedLanguage =
  raw.language ?? raw.detected_language ?? raw.language_code ?? null;
```

→ Always returns `null` because transformers.js v3 doesn't put language in those fields.

### AppProvider.tsx — INFERENCE_DONE handler (~line 151)

```ts
case MessageTypes.INFERENCE_DONE:
  setFinished(true); setLoading(false); setDownloading(false);
  if (e.data.detectedLanguage) {
    setDetectedLanguage(e.data.detectedLanguage);
    addLog(`🌍 Detected language: ${e.data.detectedLanguage}`);
  } else {
    setDetectedLanguage("auto");   // fallback — always shows badge
    addLog("🌍 Language: auto-detected (code not returned by model)");
  }
```

### Information.tsx — badge render (~line 107)

```tsx
const detectedLanguageName = useMemo(() => {
  if (!detectedLanguage) return null;
  if (detectedLanguage === "auto") return "Auto-detected";
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

// Badge renders when detectedLanguageName is non-null (always after transcription)
{
  detectedLanguageName && (
    <motion.div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5">
      <Mic className="h-3.5 w-3.5 text-emerald-500" />
      <span className="text-xs font-semibold text-emerald-700">
        Detected audio language:
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
        <Globe className="h-3 w-3" />
        {detectedLanguageName}
      </span>
    </motion.div>
  );
}
```

---

## Debug Instrumentation Already In Place

After transcription, the worker posts a debug message visible in the live activity log:

```ts
// whisper.worker.ts, after sendFinalResult():
const raw = Array.isArray(pipelineResult) ? pipelineResult[0] : pipelineResult;
self.postMessage({
  type: MessageTypes.LOADING,
  status: `debug:${JSON.stringify({
    keys: raw ? Object.keys(raw) : [],
    language: raw?.language ?? null,
    model: "Xenova/whisper-tiny",
  })}`,
});
```

In `AppProvider.tsx`, the `LOADING` case parses this and logs it to the activity panel:

```ts
} else if (e.data.status?.startsWith("debug:")) {
  const info = JSON.parse(e.data.status.slice(6));
  addLog(`[debug] model=${info.model} language=${info.language ?? "not returned"} keys=${info.keys.join(",")}`);
}
```

**After the fix is implemented**, look at what the debug log line says. It will tell you exactly what fields transformers.js v3 returns in the result object, which lets you pinpoint the correct field to extract the language from.

---

## Summary — Priority Order of Actions

1. **User: Clear IndexedDB** in browser DevTools (Application → Storage → check IndexedDB → Clear site data). This may be the only fix needed.

2. **If still defaulting to English after clearing IndexedDB:**
   - Remove `language: null` from the pipeline call in `whisper.worker.ts`
   - OR try `language: undefined`
   - OR add `forced_decoder_ids: null`

3. **If language auto-detects correctly (non-English text appears) but badge still shows "Auto-detected":**
   - Fix language extraction in `sendFinalResult()` to parse language tokens from `raw.text` using regex: `/<\|([a-z]{2,3})\|>/`
   - The token looks like `<|de|>` for German, `<|bn|>` for Bengali, etc.

4. **Remove debug postMessage** from `whisper.worker.ts` (lines after `sendFinalResult`) once language detection is confirmed working.
