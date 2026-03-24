/**
 * Utility function for merging Tailwind CSS class names.
 *
 * `cn()` combines `clsx` (for conditional class logic) with
 * `tailwind-merge` (for resolving Tailwind class conflicts).
 *
 * Example: cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
 * Result: "py-2 bg-blue-500 px-6" (px-6 overrides px-4)
 *
 * This is a foundational utility used by shadcn/ui and throughout
 * the application for composable, conflict-free class names.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
