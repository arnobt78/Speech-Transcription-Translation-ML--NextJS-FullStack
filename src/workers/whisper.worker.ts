/**
 * Whisper Speech-to-Text Web Worker
 *
 * This Web Worker runs OpenAI's Whisper model for automatic speech recognition
 * in a background thread, keeping the main UI thread responsive.
 *
 * How Web Workers work:
 * 1. The main thread creates a Worker instance pointing to this file
 * 2. Communication happens via `postMessage()` and `addEventListener('message')`
 * 3. The worker has its own global scope (`self`) — no access to DOM
 * 4. Heavy computations (ML inference) run here without blocking the UI
 *
 * Pipeline:
 * 1. Receives audio data (Float32Array) from the main thread
 * 2. Downloads and initializes the Whisper model (first run only, then cached)
 * 3. Processes audio in 30-second chunks with 5-second overlap (stride)
 * 4. Sends back partial results during processing and final results when done
 *
 * Model: Xenova/whisper-tiny.en (39M parameters, English-only, fastest, ONNX-converted)
 * Library: @huggingface/transformers (ONNX Runtime Web backend)
 */

import {
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";
import { MessageTypes } from "@/data/presets";

// ─── Singleton Pipeline ─────────────────────────────────────────────────────
class MyTranscriptionPipeline {
  static task = "automatic-speech-recognition" as const;
  static model = "Xenova/whisper-tiny.en";
  static instance: AutomaticSpeechRecognitionPipeline | null = null;

  static async getInstance(
    progressCallback?: (data: {
      status: string;
      file?: string;
      progress?: number;
      loaded?: number;
      total?: number;
    }) => void,
  ): Promise<AutomaticSpeechRecognitionPipeline> {
    if (this.instance === null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipelineFn = pipeline as any;
      this.instance = (await pipelineFn(this.task, this.model, {
        // q8 = 8-bit quantized weights: smaller download & faster inference vs fp32
        dtype: "q8",
        progress_callback: progressCallback,
      })) as AutomaticSpeechRecognitionPipeline;
    }
    return this.instance;
  }
}

// ─── Global Worker Error Handler ────────────────────────────────────────────
// Catches unhandled exceptions in the worker and forwards them to the main thread
self.addEventListener("error", (event: ErrorEvent) => {
  self.postMessage({
    type: MessageTypes.ERROR,
    error: event.message ?? "Unknown worker error",
  });
});

self.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  self.postMessage({
    type: MessageTypes.ERROR,
    error: (event.reason as Error)?.message ?? "Unknown async error in worker",
  });
});

// ─── Message Handler ────────────────────────────────────────────────────────
self.addEventListener("message", async (event: MessageEvent) => {
  const { type, audio } = event.data;
  if (type === MessageTypes.INFERENCE_REQUEST) {
    await transcribe(audio);
  }
});

// ─── Transcription Logic ────────────────────────────────────────────────────
async function transcribe(audio: Float32Array): Promise<void> {
  sendLoadingMessage("loading");

  let pipelineInstance: AutomaticSpeechRecognitionPipeline;

  try {
    pipelineInstance =
      await MyTranscriptionPipeline.getInstance(loadModelCallback);
  } catch (err) {
    self.postMessage({
      type: MessageTypes.ERROR,
      error: `Failed to load Whisper model: ${(err as Error).message}`,
    });
    return;
  }

  sendLoadingMessage("success");

  // Stride overlap smooths boundaries between 30s windows (see Whisper long-form ASR)
  const strideLengthS = 5;
  const generationTracker = new GenerationTracker(
    pipelineInstance,
    strideLengthS,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pipelineResult: any;
  try {
    // Callable pipeline: runs ASR on full Float32Array with chunked processing inside the lib
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipelineResult = await (pipelineInstance as any)(audio, {
      top_k: 0,
      do_sample: false,
      chunk_length_s: 30,
      stride_length_s: strideLengthS,
      return_timestamps: true,
      callback_function:
        generationTracker.callbackFunction.bind(generationTracker),
      chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
    });
  } catch (err) {
    self.postMessage({
      type: MessageTypes.ERROR,
      error: `Transcription failed: ${(err as Error).message}`,
    });
    return;
  }

  generationTracker.sendFinalResult(pipelineResult);
}

// ─── Progress Callbacks ─────────────────────────────────────────────────────

function loadModelCallback(data: {
  status: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}): void {
  if (data.status === "progress") {
    sendDownloadingMessage(
      data.file ?? "",
      data.progress ?? 0,
      data.loaded ?? 0,
      data.total ?? 0,
    );
  }
}

function sendLoadingMessage(status: string): void {
  self.postMessage({
    type: MessageTypes.LOADING,
    status,
  });
}

function sendDownloadingMessage(
  file: string,
  progress: number,
  loaded: number,
  total: number,
): void {
  self.postMessage({
    type: MessageTypes.DOWNLOADING,
    file,
    progress,
    loaded,
    total,
  });
}

// ─── Generation Tracker ─────────────────────────────────────────────────────
// Tracks the state of the transcription generation process, handling both
// partial (in-progress) and complete (chunk-level) results.

interface ChunkData {
  text: string;
  timestamp: [number, number];
}

interface ProcessedChunk {
  index: number;
  text: string;
  start: number;
  end: number;
}

class GenerationTracker {
  private pipeline: AutomaticSpeechRecognitionPipeline;
  private strideLengthS: number;
  private processedChunks: ProcessedChunk[] = [];
  private callbackFunctionCounter = 0;

  constructor(
    pipelineInstance: AutomaticSpeechRecognitionPipeline,
    strideLengthS: number,
  ) {
    this.pipeline = pipelineInstance;
    this.strideLengthS = strideLengthS;
  }

  /** Send the final accumulated results and signal completion */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendFinalResult(pipelineResult?: any): void {
    let chunks = this.processedChunks;

    // @huggingface/transformers v3: chunk_callback is never called.
    // The pipeline returns the full result directly. Parse it here.
    if (chunks.length === 0 && pipelineResult) {
      const raw = Array.isArray(pipelineResult)
        ? pipelineResult[0]
        : pipelineResult;
      // v3 result shape: { text: string, chunks?: [{text, timestamp:[start,end]}] }
      if (Array.isArray(raw?.chunks) && raw.chunks.length > 0) {
        chunks = raw.chunks.map(
          (c: { text: string; timestamp: [number, number] }, i: number) =>
            this.processChunk(c, i),
        );
      } else if (typeof raw?.text === "string" && raw.text.trim()) {
        // No timestamp chunks — wrap entire text as single chunk
        chunks = [{ index: 0, text: raw.text.trim(), start: 0, end: 0 }];
      }
    }

    if (chunks.length > 0) {
      const lastTs = chunks[chunks.length - 1].end;
      createResultMessage(chunks, true, lastTs);
    }
    self.postMessage({ type: MessageTypes.INFERENCE_DONE });
  }

  /** Called during generation with beam search results (partial output) */
  callbackFunction(beams: Array<{ output_token_ids: number[] }>): void {
    this.callbackFunctionCounter += 1;
    if (this.callbackFunctionCounter % 10 !== 0) return;

    const bestBeam = beams[0];
    if (!bestBeam) return;

    try {
      const tokenizer = (this.pipeline as unknown as Record<string, unknown>)
        .tokenizer as {
        decode: (
          ids: number[],
          options: { skip_special_tokens: boolean },
        ) => string;
      };
      const text = tokenizer.decode(bestBeam.output_token_ids, {
        skip_special_tokens: true,
      });
      createPartialResultMessage({
        text,
        start: this.getLastChunkTimestamp(),
        end: undefined,
      });
    } catch {
      // Partial callback failure is non-fatal — skip this update
    }
  }

  /**
   * Called when a complete audio chunk has been processed.
   * chunkData is already decoded by the library: { text, timestamp }.
   * We do NOT call tokenizer._decode_asr (removed in transformers.js v3).
   */
  chunkCallback(chunkData: ChunkData): void {
    const index = this.processedChunks.length;
    this.processedChunks.push(this.processChunk(chunkData, index));
    createResultMessage(
      this.processedChunks,
      false,
      this.getLastChunkTimestamp(),
    );
  }

  private getLastChunkTimestamp(): number {
    if (this.processedChunks.length === 0) return 0;
    return this.processedChunks[this.processedChunks.length - 1].end;
  }

  private processChunk(
    chunk: { text: string; timestamp: [number, number] },
    index: number,
  ): ProcessedChunk {
    const { text, timestamp } = chunk;
    const [start, end] = timestamp;
    return {
      index,
      text: text.trim(),
      start: Math.round(start),
      end: Math.round(end) || Math.round(start + 0.9 * this.strideLengthS),
    };
  }
}

// ─── Result Message Helpers ─────────────────────────────────────────────────

function createResultMessage(
  results: ProcessedChunk[],
  isDone: boolean,
  completedUntilTimestamp: number,
): void {
  self.postMessage({
    type: MessageTypes.RESULT,
    results,
    isDone,
    completedUntilTimestamp,
  });
}

function createPartialResultMessage(result: {
  text: string;
  start: number;
  end: number | undefined;
}): void {
  self.postMessage({
    type: MessageTypes.RESULT_PARTIAL,
    result,
  });
}
