import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
  allowedDevOrigins: ["10.10.20.144"],
  experimental: {
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
