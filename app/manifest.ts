import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FF",
    short_name: "FF",
    description: "Gym membership management",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/ff-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/ff-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
