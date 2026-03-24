/**
 * Root Layout — Server Component (Next.js App Router)
 *
 * This is the root layout for the entire application. In Next.js App Router,
 * layout.tsx wraps all pages and persists across navigations.
 *
 * Key architecture decisions:
 * - This is a Server Component (no "use client") — it renders on the server
 *   for faster initial page load and better SEO
 * - Client-side interactivity is delegated to AppProvider (a "use client"
 *   component) which wraps children with React Context
 * - suppressHydrationWarning on <html> prevents warnings from browser
 *   extensions that modify the DOM before React hydrates
 * - next/font/google loads fonts at build time, avoiding layout shift (FOUT)
 * - max-w-[1600px] (~max-w-9xl) constrains content width on ultra-wide screens
 */

import type { Metadata } from "next";
import { Open_Sans, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { AppProvider } from "@/providers/AppProvider";
import "./globals.css";

// ─── Font Configuration ──────────────────────────────────────────────────────
// next/font/google downloads fonts at build time and self-hosts them,
// eliminating external network requests and improving performance.

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

// ─── Metadata ────────────────────────────────────────────────────────────────
// Next.js uses this export to generate <head> tags (title, description, etc.)

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE ?? "FreeScribe",
  description:
    "Free AI-powered audio transcription and translation. Record or upload audio, transcribe with OpenAI Whisper, and translate into 200+ languages — all running locally in your browser.",
  icons: {
    icon: "/favicon.ico",
  },
};

// ─── Root Layout Component ───────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${openSans.variable} ${poppins.variable}`}
    >
      <body
        suppressHydrationWarning
        className="app-body min-h-screen font-sans text-slate-800 antialiased"
      >
        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col">
          <AppProvider>{children}</AppProvider>
        </div>
        <Toaster
          position="bottom-right"
          expand={false}
          richColors={false}
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast:
                "!rounded-xl !border-0 !shadow-xl !shadow-black/10 !px-4 !py-3.5 !gap-3 !font-sans",
              title: "!font-semibold !text-sm !leading-snug",
              description: "!text-xs !leading-relaxed !opacity-80",
              icon: "!w-5 !h-5",
            },
          }}
        />
      </body>
    </html>
  );
}
