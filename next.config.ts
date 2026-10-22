import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Lets <ViewTransition> animate a poster from the grid into the show page.
    viewTransition: true,
    // Remember pages already visited for 30s (and prefetched ones for 3 min),
    // so tab switches and the back button show instantly instead of
    // re-asking the server. Any change you make (watch, favorite…) clears it.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
