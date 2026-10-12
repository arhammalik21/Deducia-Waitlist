import type { NextConfig } from "next";
import path from "node:path";

const nextConfig = {
  // Keep Turbopack rooted at this package (home directory has a stray lockfile).
  turbopack: {
    root: path.join(__dirname),
  },
  // Runtime-supported; typings lag in this Next version.
  serverActions: {
    bodySizeLimit: "10mb",
  },
} as NextConfig;

export default nextConfig;
