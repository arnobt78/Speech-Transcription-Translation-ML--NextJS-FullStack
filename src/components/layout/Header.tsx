/**
 * Header — Application Navigation Header
 *
 * The header component provides branding and navigation links.
 * It uses the RippleButton for interactive feedback and Lucide icons
 * (tree-shakeable SVG icons) instead of Font Awesome CDN.
 *
 * Key patterns demonstrated:
 * - "use client" directive: Required because it uses interactive elements
 *   and the RippleButton (which uses useRef and event handlers)
 * - next/link: Provides client-side navigation without full page reloads
 * - Lucide icons: Import only the icons you need (tree-shaking)
 */

"use client";

import Link from "next/link";
import { FilePlus2, Mic2 } from "lucide-react";
import { motion } from "framer-motion";
import { RippleButton } from "@/components/ui/ripple-button";
import { useTranscription } from "@/context/TranscriptionContext";

export function Header() {
  const { handleAudioReset } = useTranscription();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-slate-200"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-6 sm:px-8 backdrop-blur-sm bg-transparent">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Mic2
              className="h-4.5 w-4.5 text-white"
              style={{ width: 18, height: 18 }}
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 transition-colors group-hover:text-blue-600">
            Free<span className="text-blue-500">Scribe</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <RippleButton
            onClick={handleAudioReset}
            className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>New Transcription</span>
          </RippleButton>
        </div>
      </div>
    </motion.header>
  );
}
