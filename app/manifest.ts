import type { MetadataRoute } from "next";

// Manifest PWA: permite "instalar" la web en el celular (pantalla de inicio,
// modo standalone). El service worker offline queda como paso futuro.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BVLZ — Gestión de Destacamento",
    short_name: "BVLZ",
    description:
      "Gestión del Destacamento N°3 de Llavallol — Bomberos Voluntarios de Lomas de Zamora.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#b91c1c",
    icons: [
      {
        src: "/logo-bomberos.jpeg",
        sizes: "400x400",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
