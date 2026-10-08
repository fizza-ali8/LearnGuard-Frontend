import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  async rewrites() {
    const adhdApi = process.env.ADHD_API_URL || "http://127.0.0.1:8000";
    return [{ source: "/api/adhd/:path*", destination: `${adhdApi}/api/adhd/:path*` }];
  },
};

export default nextConfig;
