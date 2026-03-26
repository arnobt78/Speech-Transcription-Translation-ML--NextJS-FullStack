# In-Browser Speech Transcription & Translation — Next.js, React, TypeScript, Web Workers (Whisper + NLLB), Tailwind CSS, Framer Motion Frontend Project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)](https://tailwindcss.com/)
[![Transformers.js](https://img.shields.io/badge/Transformers.js-Hugging_Face-FFD21E)](https://huggingface.co/docs/transformers.js)
[![Web Worker](https://img.shields.io/badge/Web_Worker-100%25_local-green)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
[![Privacy-First](https://img.shields.io/badge/Privacy-First-red)](https://www.privacytools.io/privacy-first/)

An open-source, **educational** app for **speech-to-text** and **text translation** that runs **entirely in your browser**: record or upload audio, transcribe with Whisper-style models, translate into many languages, and export results—**without** sending audio or transcripts to an app server for processing. Heavy ML runs in **Web Workers** `postMessage` patterns (so the UI stays responsive) via **Transformers.js** and **ONNX Runtime Web**, with no dedicated backend API required for inference.

- **Live Demo:** [https://transcription-translation.vercel.app/](https://transcription-translation.vercel.app/)

![App Screenshot 1](https://github.com/user-attachments/assets/084ba47b-29c2-4aa0-b1b8-7c8d6aa3eb49)
![App Screenshot 2](https://github.com/user-attachments/assets/378f49cc-59e6-4afa-8dd6-7d2e64fea380)
![App Screenshot 3](https://github.com/user-attachments/assets/6e13480f-0dce-41b3-a63b-e4fd3263f924)
![App Screenshot 4](https://github.com/user-attachments/assets/e0ba1299-ffe6-4b08-ae4a-55351dc04f5e)

## Table of Contents

- [Project Summary](#project-summary)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture, Backend & API](#architecture-backend--api)
- [App Routes](#app-routes)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Environment Variables (`.env`)](#environment-variables-env)
- [Getting Started](#getting-started)
- [Usage Walkthrough](#usage-walkthrough)
- [Components, Hooks & Reuse](#components-hooks--reuse)
- [Teaching Content & Code Examples](#teaching-content--code-examples)
- [Keywords](#keywords)
- [Conclusion](#conclusion)
- [License](#license)

---

## Project Summary

This project demonstrates a **privacy-first** workflow: **audio stays in the browser** (aside from **downloading model weights** from the Hugging Face Hub / CDNs the first time you run a model). **Transcription** uses a **Whisper**-family model (`Xenova/whisper-tiny`, multilingual) via **`@huggingface/transformers`**. **Translation** uses Meta’s **NLLB-200** distilled model (`Xenova/nllb-200-distilled-600M`) in a separate worker, with **200+ languages** mapped in `src/data/presets.ts`.

The UI is built with **Next.js App Router** (server layout + client islands), **React 19**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion** for motion, **Radix UI** primitives (tabs, select, slot), **Lucide** icons, and **Sonner** toasts.

---

## Features

- **Audio input:** Record from the microphone, upload audio, or drag-and-drop; the app decodes to **16 kHz PCM** for Whisper.
- **Transcription:** Speech-to-text with chunked inference, progress logs, and timestamped **chunks** (`TranscriptionChunk`).
- **Source language control:** Advanced, searchable **source language selector** (default: English) for stable multilingual transcription behavior.
- **Translation:** Choose a target language from the **NLLB** language list; translation runs in a **dedicated Web Worker** with progress feedback.
- **Runs locally (client-side ML):** Model inference happens in **Web Workers**, keeping the main thread responsive.
- **Export:** Copy text and download **plain text**, **SRT**, or **WebVTT** from transcription segments.
- **Modern UI:** Responsive layout, tabs for Transcription vs Translation, skeleton/loading states, and accessible controls.
- **SEO & metadata:** Root layout exposes titles, Open Graph, Twitter card fields, JSON-LD, plus `robots.ts` and `sitemap.ts` for crawlers.
- **Developer experience:** ESLint (flat config), TypeScript strict patterns, documented components and hooks.

---

## Technology Stack

| Layer         | Technology                                                         | What it does here                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | **Next.js 15** (App Router)                                        | File-based routing, `layout.tsx` for global shell, static generation for marketing-style pages, standard dev mode via `next dev` (with optional Turbopack script). |
| UI library    | **React 19**                                                       | Components, hooks, Context for app state.                                                                                                                          |
| Language      | **TypeScript 5.8**                                                 | Shared types in `src/types/index.ts`, safer worker message handling.                                                                                               |
| Styling       | **Tailwind CSS 4**                                                 | Utility-first styling via `src/app/globals.css` and PostCSS.                                                                                                       |
| Motion        | **Framer Motion**                                                  | Page/section transitions (e.g. header, animated containers).                                                                                                       |
| ML            | **`@huggingface/transformers`**                                    | Loads ONNX models in the browser; `pipeline()` for ASR and translation.                                                                                            |
| UI primitives | **Radix UI** (`@radix-ui/react-tabs`, `select`, `slot`)            | Accessible tabs and selects without full component libraries.                                                                                                      |
| Variants      | **class-variance-authority (CVA)** + **clsx** + **tailwind-merge** | Composable class names for buttons, badges, etc.                                                                                                                   |
| Icons         | **lucide-react**                                                   | Tree-shakeable SVG icons.                                                                                                                                          |
| Toasts        | **sonner**                                                         | Non-blocking notifications for transcribe/translate events.                                                                                                        |
| Lint          | **ESLint 9** + **eslint-config-next**                              | `npm run lint` runs `eslint . --max-warnings 0`.                                                                                                                   |

**Short notes for learners**

- **Transformers.js:** Hugging Face’s browser-oriented fork of the transformers ecosystem; it downloads models and runs them with **ONNX Runtime Web** in workers or on the main thread.
- **Web Workers:** A separate JavaScript thread with **no DOM access**; ideal for long-running ML. You pass data with `postMessage` and receive structured messages back.
- **Next.js App Router:** Server Components by default; interactive pieces use `"use client"` at the top of the file (e.g. `AppProvider`, `MainContent`).

---

## Architecture, Backend & API

- **There is no custom REST/GraphQL backend in this repository** for transcription or translation. Inference is **100% client-side** after the app loads.
- **Model files** are fetched from the Hugging Face Hub (or related CDNs) when a pipeline first runs; browsers may cache them (e.g. **Cache API** / **IndexedDB** behavior depends on Transformers.js and browser settings).
- **Next.js `headers`** (see `next.config.ts` and `vercel.json`) add security headers such as `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`. They do **not** replace a server that processes audio.
- **No `src/app/api` routes** are present: the app does not expose serverless endpoints for ML in this codebase.

If you deploy to **Vercel**, the site is a **static + edge-friendly** Next deployment: HTML/JS/CSS and prerendered routes; ML still runs **in the user’s browser**.

---

## App Routes

| Route          | Purpose                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| `/`            | Home: record/upload → preview → transcribe → results (Transcription & Translation tabs). |
| `/robots.txt`  | Generated from `src/app/robots.ts` (crawler rules + sitemap URL).                        |
| `/sitemap.xml` | Generated from `src/app/sitemap.ts` (canonical URLs for SEO).                            |

There are **no dynamic API routes** under `/api` in this project.

---

## Project Structure

```bash
scribe-transcription/
├── public/
│   └── favicon.ico              # Tab / PWA-style icon referenced in metadata
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles + Tailwind
│   │   ├── layout.tsx           # Root layout, fonts, SEO metadata, JSON-LD
│   │   ├── loading.tsx          # Route loading UI
│   │   ├── page.tsx             # Home page shell (Header + MainContent + Footer)
│   │   ├── robots.ts            # robots.txt
│   │   └── sitemap.ts           # sitemap.xml
│   ├── components/
│   │   ├── features/            # Domain UI: FileDisplay, Transcribing, Information, Transcription, Translation
│   │   ├── layout/              # Header, Footer
│   │   ├── pages/               # HomePage, MainContent (view switcher)
│   │   └── ui/                  # Reusable: Button patterns, Tabs, Card, Badge, Skeleton, SafeImage, etc.
│   ├── context/
│   │   └── TranscriptionContext.tsx   # Context type + useTranscription hook
│   ├── data/
│   │   └── presets.ts           # LANGUAGES (NLLB codes), re-exports MessageTypes / models
│   ├── hooks/
│   │   ├── useMediaRecorder.ts  # Microphone recording
│   │   ├── useTranslateWorker.ts # Translation worker lifecycle
│   │   └── useTranscriptionHistory.ts
│   ├── lib/
│   │   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   │   └── toasts.tsx           # Sonner wrappers for app events
│   ├── providers/
│   │   └── AppProvider.tsx      # Whisper worker, state, transcription pipeline
│   ├── types/
│   │   └── index.ts             # MessageTypes, TranscriptionChunk, worker message unions
│   └── workers/
│       ├── whisper.worker.ts    # Whisper ASR pipeline
│       └── translate.worker.ts  # NLLB translation pipeline
├── docs/                        # Optional design / component notes (if present)
├── eslint.config.mjs
├── next.config.ts               # Webpack fallbacks for workers; security headers
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vercel.json
```

---

## How It Works

### 1. View flow (`MainContent`)

`MainContent` implements a **priority-based router** (no React Router needed):

1. If `output` exists → show **`Information`** (results).
2. Else if loading/downloading/error → show **`Transcribing`**.
3. Else if `file` or `audioStream` → show **`FileDisplay`**.
4. Else → show **`HomePage`** (record or upload).

This keeps each screen focused and easy to test.

### 2. State (`AppProvider` + `TranscriptionContext`)

- **`AppProvider`** holds React state (file, blob, output, loading flags, logs) and creates the **Whisper** worker with `new Worker(new URL("@/workers/whisper.worker.ts", import.meta.url), { type: "module" })`.
- It listens for worker messages (`DOWNLOADING`, `LOADING`, `RESULT`, `INFERENCE_DONE`, `ERROR`) and updates UI accordingly.
- **`useTranscription()`** exposes this to any client component under the provider.

### 3. Transcription worker (`whisper.worker.ts`)

- Uses **`pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", …)`** with a **singleton** so the model loads once per session.
- Source language is sent from the UI selector (default English) to improve consistency; auto-detect behavior may vary by transformers.js Whisper implementation details.
- Processes audio in **chunks** (with overlap) and streams partial/final results back to the main thread.

### 4. Translation (`useTranslateWorker` + `translate.worker.ts`)

- A **separate worker** loads **`Xenova/nllb-200-distilled-600M`** for **text-to-text** translation.
- Language names map to **NLLB codes** in `LANGUAGES` inside `src/data/presets.ts` (e.g. `English: "eng_Latn"`).

### 5. Audio decoding

- The main thread uses the **Web Audio API** (`AudioContext`) to decode uploaded/recorded audio and resample to **16 kHz** PCM (`Float32Array`) before sending it to the Whisper worker.

---

## Environment Variables (`.env`)

**You do not need any `.env` file to run the app locally for development.** Transcription and translation work without API keys because models are loaded from the public Hugging Face ecosystem as configured in the workers.

**Optional** variables (for **branding and SEO** in `src/app/layout.tsx`):

| Variable                | Example                                        | Purpose                                                                             |
| ----------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_TITLE` | `FreeScribe`                                   | Short brand name used in the default page title template and Open Graph `siteName`. |
| `NEXT_PUBLIC_SITE_URL`  | `https://transcription-translation.vercel.app` | Canonical site URL for `metadataBase`, sitemap, and `robots.txt` sitemap line.      |

**How to set them**

1. Copy `.env.example` to `.env.local` in the project root (Next.js loads `.env.local` automatically).
2. Adjust values if you deploy to a **custom domain**.
3. Restart `npm run dev` after changes.

If these are unset, the layout falls back to sensible defaults (see `layout.tsx`).

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 LTS recommended) from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node)

### Installation

```bash
git clone <your-fork-or-repo-url>
cd scribe-transcription
npm install
```

Dependencies such as `@huggingface/transformers` are already listed in `package.json`; you do **not** need a separate manual install for local development.

### Running locally

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** (Next.js default port; if 3000 is busy, Next will suggest another).

Optional Turbopack mode:

```bash
npm run dev:turbopack
```

### Production build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Usage Walkthrough

1. **Landing (`HomePage`):** Choose optional **Advanced: source language** (default English), then start a **microphone recording**, **upload**, or **drag & drop** an audio file.
2. **Preview (`FileDisplay`):** Listen to the clip, go back, or confirm to **transcribe**.
3. **Processing (`Transcribing`):** First run downloads the Whisper model; progress appears in the UI and logs.
4. **Results (`Information`):** Read **Transcription** with timestamps; switch to **Translation**, pick a **target language**, and run translation (NLLB downloads on first use).
5. **Export:** **Copy** text or **download** `.txt`, `.srt`, or `.vtt` where supported.
6. **New session:** Use **New Transcription** in the header to reset state via `handleAudioReset`.

---

## Components, Hooks & Reuse

**Reusing in another Next.js or Vite + React project**

- **Presentational UI:** Components under `src/components/ui/` (e.g. `tabs`, `card`, `badge`, `ripple-button`) only need Tailwind + their Radix/lucide peers—copy the files and align `tailwind.config` / globals.
- **`cn()` helper:** `src/lib/utils.ts` is the standard **clsx + tailwind-merge** pattern; copy `cn` and use it everywhere for conflict-free classes.
- **Whisper worker:** Copy `whisper.worker.ts` and `presets` message types; instantiate with `new Worker(new URL(...), { type: "module" })` and the same `MessageTypes` protocol.
- **Translation worker:** Copy `translate.worker.ts` and `useTranslateWorker.ts`; ensure `LANGUAGES` includes your desired codes.
- **Context provider:** `AppProvider` is tightly coupled to this app’s state shape; for reuse, extract **only** the worker wiring into a smaller hook (e.g. `useWhisperWorker`) and supply your own UI.

**Beginner-friendly tip:** Start by reusing **`RippleButton`** + **`Tabs`** on a sandbox page, then add one worker at a time.

---

## Teaching Content & Code Examples

### Message protocol (`MessageTypes`)

`src/types/index.ts` defines constants such as `INFERENCE_REQUEST`, `RESULT`, and `ERROR`. Workers and `AppProvider` both import these so message handling stays **type-safe** and consistent.

```ts
// Simplified — see src/types/index.ts for full definitions
export const MessageTypes = {
  DOWNLOADING: "DOWNLOADING",
  LOADING: "LOADING",
  RESULT: "RESULT",
  INFERENCE_REQUEST: "INFERENCE_REQUEST",
  INFERENCE_DONE: "INFERENCE_DONE",
  ERROR: "ERROR",
} as const;
```

### Spawning the Whisper worker (pattern)

The important part is **`type: "module"`** so the worker can use `import`/`export` like the rest of your TypeScript bundle:

```ts
const worker = new Worker(
  new URL("@/workers/whisper.worker.ts", import.meta.url),
  { type: "module" },
);
worker.postMessage({
  type: MessageTypes.INFERENCE_REQUEST,
  audio: float32AudioData,
  source_language: "en", // optional, selected from Advanced source language UI
});
```

### Adding a language for translation

The NLLB model expects **specific** language codes. Extend **`LANGUAGES`** in `src/data/presets.ts` only with valid NLLB codes (see Meta’s NLLB / FLORES documentation). Example shape:

```ts
// Example entry (verify the code against NLLB docs before using)
"Spanish": "spa_Latn",
```

Wrong codes will silently fail or produce poor translations—always **verify** against the model card.

### Source language behavior (important)

- The app defaults source language to **English** for fast and stable demo performance.
- For non-English audio, set the matching **source language** from the Advanced panel before transcription.
- Whisper Tiny is speed-focused, so non-English quality may vary on short/noisy input.

---

## Keywords

**For search and learning:** transcription, translation, speech-to-text, Whisper, NLLB, Transformers.js, Hugging Face, Web Worker, ONNX, Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Radix UI, privacy, in-browser ML, client-side inference, media recording, subtitles, SRT, VTT, open source, MIT.

---

## Conclusion

This project is a practical **learning lab** for **browser-based ML**: it combines **React state management**, **off-main-thread workers**, and **modern UI** without requiring a paid speech API. It is also a **privacy-respecting** alternative to sending audio to third-party servers—at the cost of **initial download size** and **device RAM/CPU** usage. Extend it by swapping Whisper variants, adding more export formats, or wrapping the workers behind a small backend only if you need **centralized logging** or **auth**—the core inference pattern remains the same.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, modify, and distribute the code as per the terms of the license.

---

## Happy Coding! 🎉

This is an **open-source project** - feel free to use, enhance, and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio at [https://www.arnobmahmud.com](https://www.arnobmahmud.com).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
