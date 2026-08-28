import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Self-hosted deploy target (Hostinger Node.js hosting) — trims the
  // production build to a standalone server + only the node_modules it
  // actually needs, instead of shipping the whole dependency tree.
  output: "standalone",
};

export default nextConfig;
