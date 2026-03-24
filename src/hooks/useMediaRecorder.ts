/**
 * useMediaRecorder — Custom Hook for Audio Recording
 *
 * This hook encapsulates the MediaRecorder Web API for recording audio
 * from the user's microphone. Custom hooks are a powerful React pattern
 * for extracting and reusing stateful logic across components.
 *
 * Hook anatomy:
 * - State: `recordingStatus`, `duration`, internal `audioChunks`
 * - Refs: `mediaRecorder` (persists across renders without causing re-renders)
 * - Effects: Timer for tracking recording duration
 * - Actions: `startRecording`, `stopRecording`
 *
 * Why a custom hook?
 * - Separates recording logic from UI rendering
 * - Can be reused in different components without code duplication
 * - Easier to test in isolation
 * - Follows the "separation of concerns" principle
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { RecordingStatus } from "@/types";

interface UseMediaRecorderReturn {
  /** Current recording state */
  recordingStatus: RecordingStatus;
  /** Duration of current recording in seconds */
  duration: number;
  /** Microphone error message, null when no error */
  micError: string | null;
  /** Clear the current mic error */
  clearMicError: () => void;
  /** Start recording audio from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and return the audio blob */
  stopRecording: () => void;
}

export function useMediaRecorder(
  onRecordingComplete: (blob: Blob) => void,
): UseMediaRecorderReturn {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("inactive");
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const clearMicError = useCallback(() => setMicError(null), []);

  // Refs persist across renders without triggering re-renders
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // WebM is widely supported for MediaRecorder; decoder in AppProvider accepts various blobs
  const mimeType = "audio/webm";

  /**
   * Request microphone access and start recording.
   * Uses the MediaDevices API (part of WebRTC).
   */
  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      // Request microphone permission from the user
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = streamData;
    } catch (err) {
      const error = err as DOMException;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setMicError(
          "Microphone access was denied. Please allow microphone access in your browser's address bar or system settings, then try again.",
        );
      } else if (error.name === "NotFoundError") {
        setMicError(
          "No microphone found. Please connect a microphone and try again.",
        );
      } else if (error.name === "NotReadableError") {
        setMicError(
          "Microphone is in use by another application. Please close it and try again.",
        );
      } else {
        setMicError(`Could not access microphone: ${error.message}`);
      }
      return;
    }

    setRecordingStatus("recording");

    // Create MediaRecorder instance with the audio stream
    const media = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorder.current = media;
    audioChunks.current = [];

    // Collect audio data chunks as they become available
    mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.current.start();
  }, []);

  /**
   * Stop recording and assemble the audio chunks into a single Blob.
   */
  const stopRecording = useCallback(() => {
    if (!mediaRecorder.current) return;

    setRecordingStatus("inactive");
    mediaRecorder.current.stop();

    mediaRecorder.current.onstop = () => {
      // Combine all audio chunks into a single Blob
      const audioBlob = new Blob(audioChunks.current, { type: mimeType });
      onRecordingComplete(audioBlob);
      audioChunks.current = [];
      setDuration(0);

      // Stop all tracks to release the microphone
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onRecordingComplete]);

  // Timer effect: increment duration every second while recording
  useEffect(() => {
    if (recordingStatus !== "recording") return;

    const interval = setInterval(() => {
      setDuration((curr) => curr + 1);
    }, 1000);

    // Cleanup: clear interval when recording stops or component unmounts
    return () => clearInterval(interval);
  }, [recordingStatus]);

  return {
    recordingStatus,
    duration,
    micError,
    clearMicError,
    startRecording,
    stopRecording,
  };
}
