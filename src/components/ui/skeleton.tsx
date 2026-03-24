/**
 * Skeleton — Loading placeholder component
 *
 * Displays an animated pulse placeholder that matches the dimensions
 * of the content it replaces. Used during loading states to prevent
 * layout shift (CLS) and provide visual feedback.
 *
 * The skeleton uses Tailwind's `animate-pulse` for a subtle breathing
 * animation that indicates content is loading.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/60", className)}
    />
  );
}
