import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Ensure pages with client-side dependencies don't get prerendered */
  output: "standalone",
  /* Disable Turbopack and use webpack for better pdfjs-dist support */
  experimental: {
    turbopack: false,
  },
  /* Configure webpack to handle pdfjs-dist and canvas */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
