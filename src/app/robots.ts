/**
 * `robots.ts` → static `/robots.txt` route in App Router.
 * Tells crawlers what may be indexed; pairs with `sitemap.ts` for discovery.
 */
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://transcription-translation.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
