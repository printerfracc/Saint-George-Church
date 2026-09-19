import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./public/logo.png"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  serverExternalPackages: ["xlsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
