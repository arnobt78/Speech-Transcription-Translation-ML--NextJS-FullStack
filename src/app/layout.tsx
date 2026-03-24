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

// ─── Metadata (SEO) ───────────────────────────────────────────────────────────
// Next.js generates <head> tags from this object. `metadataBase` makes relative
// OG/Twitter URLs resolve to the canonical production site when env is unset.

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://transcription-translation.vercel.app";

const appName = process.env.NEXT_PUBLIC_APP_TITLE ?? "FreeScribe";

const defaultTitle = `${appName} — Local AI Voice & Audio Transcription & Translation`;

const siteDescription =
  "Machine-learning powered, privacy-first voice and audio transcription and translation in your browser. Record or upload audio, transcribe with Whisper-class models via Web Workers, translate into many languages, and export — no server upload required.";

const siteKeywords = [
  "FreeScribe",
  "transcription",
  "translation",
  "speech to text",
  "voice transcription",
  "audio transcription",
  "machine learning",
  "local browser ML",
  "Web Worker",
  "Whisper",
  "OpenAI Whisper",
  "Next.js",
  "React",
  "TypeScript",
  "privacy",
  "in-browser AI",
  "Hugging Face Transformers",
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${appName}`,
  },
  description: siteDescription,
  keywords: [...siteKeywords],
  applicationName: appName,
  authors: [
    {
      name: "Arnob Mahmud",
      url: "https://www.arnobmahmud.com",
    },
  ],
  creator: "Arnob Mahmud",
  publisher: "Arnob Mahmud",
  category: "technology",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: appName,
    title: defaultTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: defaultTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

// Structured data for search engines (JSON-LD) — complements the `metadata` object above
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: appName,
  url: siteUrl,
  description: siteDescription,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Arnob Mahmud",
    url: "https://www.arnobmahmud.com",
    email: "contact@arnobmahmud.com",
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
        {/* JSON-LD must be a string; stringify runs on the server at render time */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
