/**
 * SafeImage — next/image with native <img> fallback
 *
 * Wraps Next.js <Image> and falls back to a plain <img> tag when
 * image optimization fails (e.g. Vercel quota exceeded, HTTP 402).
 *
 * Flow:
 * 1. First render: uses Next.js <Image> (optimization, srcset, etc.)
 * 2. If load succeeds: behaves like normal next/image
 * 3. If load fails: onError fires → state flips → renders <img> with
 *    the original URL (bypasses /_next/image optimizer)
 */

"use client";

import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import { useCallback, useState, type SyntheticEvent } from "react";

type SafeImageProps = ImageProps;

export function SafeImage({
  alt,
  src,
  className,
  fill,
  width,
  height,
  onError,
  priority,
  loading,
  ...rest
}: SafeImageProps) {
  const [useNative, setUseNative] = useState(false);
  const resolvedSrc = typeof src === "string" ? src : "";

  const handleError = useCallback(
    (e: SyntheticEvent<HTMLImageElement, Event>) => {
      onError?.(e);
      if (resolvedSrc) setUseNative(true);
    },
    [onError, resolvedSrc],
  );

  const eager = Boolean(priority || loading === "eager");

  // Fallback to native <img> when Next.js image optimization fails
  if (useNative && resolvedSrc) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- fallback when /_next/image fails
        <img
          alt={alt}
          src={resolvedSrc}
          className={cn("absolute inset-0 h-full w-full", className)}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          sizes={typeof rest.sizes === "string" ? rest.sizes : undefined}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fallback when /_next/image fails
      <img
        alt={alt}
        src={resolvedSrc}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        className={cn(className)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      className={className}
      fill={fill}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      onError={handleError}
    />
  );
}
