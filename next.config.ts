import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.11.110"],
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
