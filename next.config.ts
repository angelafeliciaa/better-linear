import type { NextConfig } from "next";

// Allow relocating .next outside iCloud Drive to avoid Turbopack cache races.
// Set NEXT_DIST_DIR=/tmp/better-linear-next in .env.local for local dev.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
