/**
 * Badge — Status indicator component
 *
 * Small labels for displaying status, categories, or counts.
 * Uses the `class-variance-authority` (cva) library for managing
 * variant styles — a modern alternative to complex conditional class logic.
 *
 * cva works by:
 * 1. Defining a base set of classes
 * 2. Defining named variants (like "default", "success", "destructive")
 * 3. Generating a function that returns the right classes based on props
 */

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-blue-200 bg-blue-50 text-blue-700",
        secondary: "border-slate-200 bg-slate-100 text-slate-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        destructive: "border-rose-200 bg-rose-50 text-rose-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        outline: "border-slate-200 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
