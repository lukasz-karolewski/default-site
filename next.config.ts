import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ["192.168.11.110"],
  poweredByHeader: false
};

export default nextConfig;
