import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TV Time 2",
    short_name: "TV Time 2",
    description: "Personal show and episode tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#0f171f",
    theme_color: "#0f171f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
