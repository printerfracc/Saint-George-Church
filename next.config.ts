import type { NextConfig } from "next";

function r2ImageHostname() {
  const domain = process.env.R2_PUBLIC_DOMAIN?.trim() || "https://media.stgeorgemataria.com";
  return new URL(domain.includes("://") ? domain : `https://${domain}`).hostname;
}

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./public/icon.png", "./public/google-thumbnail.jpg"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["xlsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: r2ImageHostname(),
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
