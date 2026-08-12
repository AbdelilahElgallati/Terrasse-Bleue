import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Terrasse Bleue — Administration",
    short_name: "TB Admin",
    description: "Espace sécurisé de gestion du restaurant Terrasse Bleue.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e5",
    theme_color: "#123b4a",
    icons: [
      {
        src: "/terrasse-bleue-logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
