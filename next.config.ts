import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.187"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
  // Force the Prisma query engine binary (loaded at runtime by path) to be
  // bundled into every serverless function. Without this, Vercel deployments
  // fail with "could not locate the Query Engine for runtime rhel-openssl-3.0.x".
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
