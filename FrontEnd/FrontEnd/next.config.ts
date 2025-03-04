import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '7201',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
