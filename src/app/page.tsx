/**
 * Home Page — Server Component Entry Point
 *
 * This is a Next.js Server Component that renders the page shell.
 * The actual interactive content is in the MainContent client component,
 * which reads state from TranscriptionContext to determine what to show.
 *
 * Pattern: "Thin Server Page → Fat Client Component"
 * - Server page handles routing and metadata
 * - Client component handles all interactivity and state
 */

import { MainContent } from "@/components/pages/MainContent";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <MainContent />
      <Footer />
    </>
  );
}
