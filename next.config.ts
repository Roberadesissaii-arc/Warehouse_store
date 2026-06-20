import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add your PC's LAN IP when opening the dev server from another device on Wi-Fi.
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.4.21", "192.168.4.41"],
  async redirects() {
    return [{ source: "/cart", destination: "/bag", permanent: true }];
  },
};

export default nextConfig;
