import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // the placeholder cats: the site serves them resized and as WebP or AVIF, cached for a month, from here
    remotePatterns: [{ protocol: "https", hostname: "cataas.com", pathname: "/cat/**" }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
