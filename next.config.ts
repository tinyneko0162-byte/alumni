import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be opened through a Cloudflare quick tunnel
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
