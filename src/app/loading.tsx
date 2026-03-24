/**
 * Loading — Automatic Loading UI
 *
 * Next.js App Router automatically shows this component while a page
 * is loading (during route transitions). It uses React Suspense boundaries
 * under the hood.
 *
 * We display skeleton placeholders that match the general layout structure
 * to minimize Cumulative Layout Shift (CLS).
 */

import { Skeleton } from "@/components/ui/skeleton";

/** Shown by Next.js while the route segment suspends (e.g. slow dynamic import). */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4">
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-72 rounded-xl" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full max-w-md rounded-2xl" />
      </div>

      {/* Footer skeleton */}
      <div className="flex flex-col items-center gap-2 p-6">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}
