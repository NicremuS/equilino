import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

// Security + performance headers applied only in production.
// In dev (LAN access from phone) CSP and HSTS cause HMR and HTTP→HTTPS issues.
const productionHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  // Aggressive static-asset caching — Next.js content-hashes all _next/static/* files
  // so they can be cached for a full year without stale-content risk.
  // Applied to the /_next/static/* route below, not to the catch-all.
];

// Long-lived immutable cache for hashed static assets (JS, CSS, fonts, images)
const staticAssetHeaders = [
  { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
];

const nextConfig: NextConfig = {
  devIndicators: false,

  // Strip the X-Powered-By: Next.js header — reduces fingerprinting surface
  poweredByHeader: false,

  // Compress responses in production (gzip/br via Next.js built-in)
  compress: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    // Modern formats: WebP for older browsers, AVIF for capable ones
    formats: ['image/avif', 'image/webp'],
    // Device sizes optimised for mobile-first
    deviceSizes: [375, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256],
    // Minimum TTL: 1 hour (images are then served from Next.js cache)
    minimumCacheTTL: 3600,
  },

  experimental: {
    // Optimize CSS output — removes unused keyframes / selectors in production
    optimizeCss: true,
    // Partial pre-rendering: statically render as much of each page as possible,
    // then stream in dynamic parts. Improves FCP / LCP on mobile.
    ppr: false, // enable once the app is fully tested with PPR
  },

  async headers() {
    if (isDev) return [];
    return [
      // Immutable cache for all hashed static files (JS chunks, CSS, fonts, images)
      {
        source: '/_next/static/:path*',
        headers: staticAssetHeaders,
      },
      // Security + perf headers for all pages and API routes
      {
        source: '/(.*)',
        headers: productionHeaders,
      },
    ];
  },
};

export default nextConfig;
