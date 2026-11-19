import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be opened through a Cloudflare quick tunnel
  allowedDevOrigins: ["*.trycloudflare.com"],
  // slip pictures are sent with the order (compressed in the browser, at most 3 MB)
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
