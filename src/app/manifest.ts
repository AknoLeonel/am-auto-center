import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AM Auto Center | Painel",
    short_name: "AM Painel",
    description: "Ordens de serviço, pedidos e retornos da AM Auto Center.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    background_color: "#0b1d36",
    theme_color: "#0b1d36",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
