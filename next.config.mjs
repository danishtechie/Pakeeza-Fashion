/** @type {import('next').NextConfig} */
const csp = [
  "default-src 'self'",
  // Next.js injects its hydration payload as an inline <script> tag, so a
  // nonce-free CSP needs 'unsafe-inline' here; the same goes for style-src
  // (Tailwind's utility classes are external, but a couple of inline
  // style="" attributes — e.g. the product gallery zoom — need it too).
  // For a stricter, nonce-based CSP, generate a per-request nonce in
  // middleware.ts and thread it through next.config's headers() + every
  // <script>/<style> tag instead.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
