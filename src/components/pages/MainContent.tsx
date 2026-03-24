/**
 * MainContent — Client-Side View Router
 *
 * This component reads the TranscriptionContext state and renders
 * the appropriate view:
 *
 * 1. output (results exist) → Information view (transcription/translation)
 * 2. loading/downloading (ML model active) → Transcribing view (progress)
 * 3. file/audioStream (audio selected) → FileDisplay view (preview+confirm)
 * 4. default (nothing selected) → HomePage view (record/upload)
 *
 * This mirrors the original App.jsx conditional rendering logic,
 * but extracted into a dedicated client component for cleaner separation.
 */

"use client";

import { useTranscription } from "@/context/TranscriptionContext";
import { HomePage } from "@/components/pages/HomePage";
import { FileDisplay } from "@/components/features/FileDisplay";
import { Transcribing } from "@/components/features/Transcribing";
import { Information } from "@/components/features/Information";

export function MainContent() {
  const {
    file,
    audioStream,
    output,
    downloading,
    downloadProgress,
    loading,
    finished,
    transcriptionError,
    handleAudioReset,
    handleFormSubmission,
  } = useTranscription();

  // Priority-based view selection:
  // If we have output, show results regardless of other state
  if (output) {
    return <Information output={output} finished={finished} />;
  }

  // If model is downloading or loading (or errored while loading), show progress/error
  if (loading || downloading || transcriptionError) {
    return (
      <Transcribing
        downloading={downloading}
        downloadProgress={downloadProgress}
        error={transcriptionError}
      />
    );
  }

  // If user selected a file or recorded audio, show preview
  if (file || audioStream) {
    return (
      <FileDisplay
        file={file}
        audioStream={audioStream}
        handleFormSubmission={handleFormSubmission}
        handleAudioReset={handleAudioReset}
      />
    );
  }

  // Default: show the home/landing page
  return <HomePage />;
}
