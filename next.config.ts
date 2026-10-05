import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Allows local verification without clearing a OneDrive-locked build cache.
  distDir: process.env.PORTFOLIO_BUILD_DIR || ".next",
};

export default nextConfig;
