# Machine Learning Powered Voice/Audio Transcription & Translation - Next.js, React, TypeScript, Web Worker (Whisper & Translate), TailwindCSS, Framer Motion FullStack Project

A modern, open-source transcription and translation web application that leverages on-device machine learning models, running entirely in your browser using Web Workers. Users can record or upload audio, transcribe speech to text, translate between languages, and export the results — all with privacy and speed, without sending data to any backend server.

- **Live Demo:** [https://transcription-translation.vercel.app/](https://transcription-translation.vercel.app/)

---

## Table of Contents

- [Project Summary](#project-summary)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Web Worker Architecture](#web-worker-architecture)
  - [Machine Learning Model](#machine-learning-model)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Usage Walkthrough](#usage-walkthrough)
- [Teaching Content & Examples](#teaching-content--examples)
- [Keywords](#keywords)
- [Conclusion](#conclusion)
- [License](#license)

---

## Features

- 🎙️ **Audio Input:** Record live or upload MP3/WAV files for transcription.
- ✍️ **Transcription:** Converts speech to text using ML models (OpenAI Whisper).
- 🌎 **Translation:** Translate transcribed text into multiple languages.
- ⚡ **Runs Locally:** All ML inference runs in-browser via Web Workers for privacy and speed.
- 💾 **Export:** Download or copy the resulting text.
- 🚀 **Modern UI:** Built with React, Vite, and TailwindCSS.
- 💡 **No Cost:** 100% free and open-source.

---

## Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Web Worker ML:** [`@xenova/transformers`](https://github.com/xenova/transformers.js)
- **Transcription Model:** OpenAI Whisper (via transformers.js)
- **Other:** ESLint, PostCSS, modern ES2020+ JavaScript

---

## Project Structure

```bash
/
├── public/
│   └── vite.svg           # App icon
├── src/
│   ├── components/
│   │   ├── Header.jsx     # Top navigation and branding
│   │   ├── Footer.jsx     # Footer
│   │   ├── HomePage.jsx   # Landing/upload UI
│   │   ├── FileDisplay.jsx# Audio file display and controls
│   │   ├── Information.jsx# Output display
│   │   └── Transcribing.jsx # Loading/transcribing UI
│   ├── utils/
│   │   ├── presets.js     # Worker message types, language codes, model names
│   │   └── whisper.worker.js # Main ML Web Worker logic
│   ├── App.jsx            # Main application logic
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind and custom styles
├── index.html             # HTML template
├── package.json           # Dependencies & scripts
└── ... (config files)
```

---

## How It Works

### Web Worker Architecture

- The app delegates heavy ML inference to a **Web Worker** (`whisper.worker.js`). This prevents UI blocking and ensures smooth user experience.
- The worker receives audio data, loads the ML model (Whisper), and performs transcription/translation asynchronously.
- Communication uses structured messages (see `presets.js` for message types).

### Machine Learning Model

- **Transcription** uses the _OpenAI Whisper_ model, via `@xenova/transformers`, running entirely in-browser (no server needed).
- **Translation** is performed using Whisper’s multilingual capabilities and language codes defined in `presets.js`.
- Model progress and results are streamed back to the main app for display.

---

## Getting Started

### Installation

1. **Clone the repo:**

   ```bash
   git clone https://github.com/arnobt78/FreeScribe-Transcription-Translation-ML-App--ReactVite.git
   cd FreeScribe-Transcription-Translation-ML-App--ReactVite
   ```

2. **Install Node.js:**  
   Download and install from [nodejs.org](https://nodejs.org/en/).

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Install Transformers.js:**

   ```bash
   npm i @xenova/transformers
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Usage Walkthrough

1. **Home Screen:**  
   Select to record audio or upload an MP3/WAV file.

2. **Audio Processing:**  
   Once uploaded or recorded, the file is displayed. Click "Transcribe" to start.

3. **ML Inference:**  
   The app loads the Whisper model in a web worker and processes your audio.

4. **View & Translate:**  
   The transcribed text appears. Use translation options to convert it into another language.

5. **Export or Copy:**  
   Download the text as a file or copy it to your clipboard.

---

## Teaching Content & Examples

### Example: Adding a New Language

To add a new translation language, extend the `LANGUAGES` object in `src/utils/presets.js`:

```javascript
export const LANGUAGES = {
  ...,
  "Spanish": "spa_Latn",
  // Add more as needed
};
```

### Example: Using the Web Worker

The worker is initialized in `App.jsx`:

```javascript
worker.current = new Worker(
  new URL("./utils/whisper.worker.js", import.meta.url),
  { type: "module" },
);
worker.current.postMessage({
  type: MessageTypes.INFERENCE_REQUEST,
  audio,
  model_name: "openai/whisper-tiny.en",
});
```

The worker receives audio, runs the model, and sends back results via `postMessage`.

---

## Keywords

- Transcription
- Translation
- Machine Learning
- React
- Vite
- TailwindCSS
- Web Worker
- OpenAI Whisper
- Speech Recognition
- @xenova/transformers
- In-browser ML
- Audio Processing

---

## Conclusion

FreeScribe streamlines advanced speech-to-text and language translation—directly in your browser, for free. Powered by modern frontend tools and the latest open-source ML models, it’s a practical, privacy-respecting alternative to expensive SaaS solutions.

---

## License

MIT License. © 2030 [arnobt78](https://github.com/arnobt78)

---

## Happy Coding! 🎉

Feel free to use this Project Repository and extend this project further!

If you have any questions or want to share your work, reach out via GitHub or my portfolio [https://arnob-mahmud.vercel.app/](https://arnob-mahmud.vercel.app/).

**Enjoy building and learning!** 🚀

Thank you! 😊

---
