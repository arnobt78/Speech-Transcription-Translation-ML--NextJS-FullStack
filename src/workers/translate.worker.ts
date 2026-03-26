/**
 * Translation Web Worker
 *
 * This Web Worker runs Meta's NLLB-200 (No Language Left Behind) model
 * for text translation between 200+ languages.
 *
 * How it works:
 * 1. Receives text and language pair from the main thread
 * 2. Downloads and initializes the NLLB model (first run only)
 * 3. Translates text from source to target language
 * 4. Sends back progress updates and final translated text
 *
 * Model: Xenova/nllb-200-distilled-600M (600M parameters)
 * This is a distilled (smaller, faster) version of the full NLLB-200 model.
 */

import { pipeline, type TranslationPipeline } from "@huggingface/transformers";

// ─── Singleton Pipeline ─────────────────────────────────────────────────────
// Same singleton pattern as the Whisper worker — create once, reuse

class MyTranslationPipeline {
  static task = "translation" as const;
  static model = "Xenova/nllb-200-distilled-600M";
  static instance: TranslationPipeline | null = null;

  static async getInstance(
    progressCallback?: (data: { status: string; progress?: number }) => void,
  ): Promise<TranslationPipeline> {
    if (this.instance === null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipelineFn = pipeline as any;
      this.instance = (await pipelineFn(this.task, this.model, {
        progress_callback: progressCallback,
      })) as TranslationPipeline;
    }
    return this.instance;
  }
}

// ─── Message Handler ────────────────────────────────────────────────────────
// Expected payload shape: `TranslateRequest` — `text` is string[] (chunks joined by worker usage)

self.addEventListener("message", async (event: MessageEvent) => {
  const { text, src_lang, tgt_lang } = event.data;
  const isBatch = Array.isArray(text);

  // Get (or create) the translation pipeline instance
  const translator = await MyTranslationPipeline.getInstance((x) => {
    // Forward download/loading progress to the main thread
    self.postMessage(x);
  });

  // Access tokenizer for decoding intermediate results
  const tokenizer = (translator as unknown as Record<string, unknown>)
    .tokenizer as {
    decode: (
      ids: number[],
      options: { skip_special_tokens: boolean },
    ) => string;
  };

  // Pipeline is invoked with source/target NLLB codes (e.g. eng_Latn → fra_Latn)
  // Run translation with streaming callback for live updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (translator as any)(text, {
    tgt_lang,
    src_lang,
    callback_function: (x: Array<{ output_token_ids: number[] }>) => {
      if (isBatch) return;
      // In v3, output_token_ids may be nested — guard before decoding
      const ids = x?.[0]?.output_token_ids;
      if (!ids) return;
      // Send intermediate decoded text back to UI for live preview
      self.postMessage({
        status: "update",
        output: tokenizer.decode(ids, {
          skip_special_tokens: true,
        }),
      });
    },
  });

  // Send the final complete translation
  self.postMessage({
    status: "complete",
    output,
  });
});
