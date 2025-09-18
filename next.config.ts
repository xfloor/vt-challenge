import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
  },
};

export default nextConfig;
