import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
  allowedDevOrigins: [
    "mom-sprang-various.ngrok-free.dev",
    "lyda-overweak-subobtusely.ngrok-free.dev",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/meetings",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
