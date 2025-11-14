import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Ensure pages with client-side dependencies don't get prerendered */
  output: "standalone",
  /* Other config options */
};

export default nextConfig;
