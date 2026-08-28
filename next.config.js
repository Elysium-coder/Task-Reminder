/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip ESLint and type-check steps during build so `next build` (and the
  // Vercel deploy) never fails on lint or type issues. Source is plain JS and
  // runtime behavior is validated by running the server.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // API routes intentionally run on the Node.js runtime (the default) so
  // mongoose / nodemailer / web-push work. Do NOT set runtime: 'edge'.
  // Env vars are read at REQUEST time only, never at build time, so builds
  // succeed even when secrets are not configured.
  images: { unoptimized: true },
};

module.exports = nextConfig;
