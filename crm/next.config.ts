import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lead files (CSV / XLSX) are uploaded through a server action.
  experimental: { serverActions: { bodySizeLimit: "25mb" } },
  poweredByHeader: false,
  // This app lives in a sub-folder of the marketing-site repo, which has its own lockfile.
  turbopack: { root: process.cwd() },
  // The xlsx reader pulls in optional cloud SDKs that must not be bundled.
  serverExternalPackages: ["read-excel-file", "unzipper"],
};

export default nextConfig;
