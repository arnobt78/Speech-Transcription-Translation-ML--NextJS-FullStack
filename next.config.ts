import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * - `reactStrictMode`: Enables React strict mode for catching common bugs
 * - `turbopack`: Configures Turbopack (used in `next dev --turbopack`)
 *   Maps Node built-ins to empty modules so Web Worker imports don't break
 *   in the browser bundle (same effect as webpack's `resolve.fallback: false`)
 * - `webpack`: Equivalent fallback config kept for `next build` (Webpack)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Cache static Next.js assets aggressively (they're content-hashed)
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Turbopack config — used by `next dev --turbopack`
  // Turbopack automatically stubs Node built-ins (fs, path, crypto) for
  // browser bundles, so no explicit resolveAlias entries are needed here.
  turbopack: {},

  webpack: (config, { isServer }) => {
    // Configure webpack to handle Web Worker imports for ML model inference
    // Workers run heavy ML computations off the main thread
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
