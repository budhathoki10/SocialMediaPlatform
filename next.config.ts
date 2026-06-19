import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const origins = ["sasquatch-rickety-imaging.ngrok-free.dev"];

  try {
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (nextAuthUrl) {
      origins.push(new URL(nextAuthUrl).host);
    }
  } catch {
    // Keep the static local ngrok origin above if NEXTAUTH_URL is not parseable.
  }

  return Array.from(new Set(origins));
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;