"use client";

import { toast } from "sonner";
import { Mic, MicOff, Wand2, CheckCheck, Languages, Check } from "lucide-react";

function ToastContent({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold leading-snug">{title}</span>
        <span className="text-xs leading-relaxed opacity-75">
          {description}
        </span>
      </div>
    </div>
  );
}

export const appToast = {
  recordingStarted() {
    toast.custom(
      () => (
        <ToastContent
          icon={<Mic className="h-4 w-4" />}
          iconBg="bg-red-100"
          iconColor="text-red-500"
          title="Recording started"
          description="Speak clearly into your microphone"
        />
      ),
      {
        id: "recording-started",
        duration: 3000,
        style: {
          background: "linear-gradient(135deg, #fff1f2 0%, #ffffff 60%)",
          border: "1px solid #fecdd3",
        },
      },
    );
  },

  recordingStopped() {
    toast.custom(
      () => (
        <ToastContent
          icon={<MicOff className="h-4 w-4" />}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
          title="Recording stopped"
          description="Audio captured — ready to transcribe"
        />
      ),
      {
        id: "recording-stopped",
        duration: 3000,
        style: {
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%)",
          border: "1px solid #fed7aa",
        },
      },
    );
  },

  transcribingStarted() {
    toast.custom(
      () => (
        <ToastContent
          icon={<Wand2 className="h-4 w-4" />}
          iconBg="bg-violet-100"
          iconColor="text-violet-500"
          title="Transcription started"
          description="Whisper AI is processing your audio"
        />
      ),
      {
        id: "transcribing",
        duration: Infinity,
        style: {
          background: "linear-gradient(135deg, #f5f3ff 0%, #ffffff 60%)",
          border: "1px solid #ddd6fe",
        },
      },
    );
  },

  transcribingDone() {
    toast.dismiss("transcribing");
    toast.custom(
      () => (
        <ToastContent
          icon={<CheckCheck className="h-4 w-4" />}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          title="Transcription complete"
          description="Your audio has been transcribed successfully"
        />
      ),
      {
        id: "transcribing-done",
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #f5f3ff 0%, #ffffff 60%)",
          border: "1px solid #ddd6fe",
        },
      },
    );
  },

  translationStarted(language: string) {
    toast.custom(
      () => (
        <ToastContent
          icon={<Languages className="h-4 w-4" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-500"
          title="Translation started"
          description={`Translating into ${language}…`}
        />
      ),
      {
        id: "translating",
        duration: Infinity,
        style: {
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)",
          border: "1px solid #bbf7d0",
        },
      },
    );
  },

  translationDone() {
    toast.dismiss("translating");
    toast.custom(
      () => (
        <ToastContent
          icon={<Check className="h-4 w-4" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title="Translation complete"
          description="Your text has been translated successfully"
        />
      ),
      {
        id: "translating-done",
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)",
          border: "1px solid #bbf7d0",
        },
      },
    );
  },
};
