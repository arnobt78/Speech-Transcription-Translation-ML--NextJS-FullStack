/**
 * Footer — Application Footer
 *
 * Displays copyright information and author credits.
 * This is a simple presentational component with no state or side effects.
 *
 * Note: Even though this component has no interactivity, it's marked as
 * "use client" because it uses `new Date()` which should be consistent
 * between server and client rendering to avoid hydration mismatches.
 */

"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      className="mt-auto border-t border-slate-200"
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-center px-6 sm:px-8 backdrop-blur-sm bg-transparent">
        {/* Year updates client-side — "use client" avoids SSR/client year mismatch */}
        <p className="text-sm text-slate-400">
          &copy; {new Date().getFullYear()} FreeScribe &mdash; All rights
          reserved.
        </p>
      </div>
    </motion.footer>
  );
}
