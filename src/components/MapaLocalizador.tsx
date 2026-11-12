"use client";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "gmpx-store-locator": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "map-id"?: string };
    }
  }
}

// Localizador do Google Maps (Locator Plus / Extended Component Library). Sem a chave no .env, a seção
// mostra só o cartão com o link "Ver rota no mapa", sem quebrar nada.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
const LIB_URL = "https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.15/index.min.js";

const oficina = { lat: -11.048777614971213, lng: -45.207307796958915 };

const CONFIGURATION = {
  locations: [
    {
      title: site.name,
      address1: site.street,
      address2: `${site.city} - ${site.state}, ${site.zip}, Brasil`,
      coords: oficina,
      placeId: "ChIJ92_kjb-4NJMRMcZnV4erNiM",
    },
  ],
  mapOptions: {
    center: oficina,
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 15,
    zoomControl: true,
    maxZoom: 17,
    mapId: "",
  },
  mapsApiKey: API_KEY,
  capabilities: { input: true, autocomplete: true, directions: true, distanceMatrix: true, details: true, actions: false },
};

// Cores e fontes do site (globals.css) aplicadas ao componente do Google.
const tema = {
  "--gmpx-color-surface": "#ffffff",
  "--gmpx-color-on-surface": "var(--color-ink)",
  "--gmpx-color-on-surface-variant": "var(--color-mute)",
  "--gmpx-color-primary": "var(--color-brand)",
  "--gmpx-color-outline": "var(--color-line)",
  "--gmpx-fixed-panel-width-row-layout": "24em",
  "--gmpx-fixed-panel-height-column-layout": "55%",
  "--gmpx-font-family-base": "var(--font-body), sans-serif",
  "--gmpx-font-family-headings": "var(--font-cond), var(--font-body), sans-serif",
  "--gmpx-font-size-base": "0.95rem",
  "--gmpx-hours-color-open": "var(--color-wa)",
  "--gmpx-hours-color-closed": "var(--color-alerta)",
  "--gmpx-rating-color": "#ffb300",
  "--gmpx-rating-color-empty": "var(--color-line)",
} as React.CSSProperties;

type Locator = HTMLElement & { configureFromQuickBuilder: (c: typeof CONFIGURATION) => void };

function carregarBiblioteca() {
  // O atributo se chama "key", que o React reserva; por isso o loader é criado direto no DOM.
  if (!document.querySelector("gmpx-api-loader")) {
    const loader = document.createElement("gmpx-api-loader");
    loader.setAttribute("key", API_KEY);
    loader.setAttribute("solution-channel", "GMP_QB_locatorplus_v11_cABCDE");
    document.body.appendChild(loader);
  }
  if (document.querySelector(`script[src="${LIB_URL}"]`)) return;
  const s = document.createElement("script");
  s.type = "module";
  s.src = LIB_URL;
  document.head.appendChild(s);
}

export function MapaLocalizador() {
  const ref = useRef<HTMLDivElement>(null);
  const locRef = useRef<HTMLElement>(null);
  const [ativo, setAtivo] = useState(false);

  // Só baixa o script do Google quando o visitante chega perto do mapa (não pesa no carregamento inicial).
  useEffect(() => {
    if (!API_KEY || ativo) return;
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setAtivo(true), { rootMargin: "500px 0px" })
      : null;
    if (io && ref.current) io.observe(ref.current);
    else setAtivo(true);
    return () => io?.disconnect();
  }, [ativo]);

  useEffect(() => {
    if (!ativo) return;
    carregarBiblioteca();
    let cancelado = false;
    customElements.whenDefined("gmpx-store-locator").then(() => {
      if (!cancelado && locRef.current) (locRef.current as Locator).configureFromQuickBuilder(CONFIGURATION);
    });
    return () => { cancelado = true; };
  }, [ativo]);

  if (!API_KEY) return null;

  return (
    <div ref={ref} className="h-[560px] overflow-hidden rounded-md border border-line bg-white md:h-[520px]">
      {ativo ? (
        <gmpx-store-locator map-id={MAP_ID} ref={locRef} style={{ display: "block", width: "100%", height: "100%", ...tema }} />
      ) : (
        <div className="grid h-full place-items-center text-mute">Carregando mapa…</div>
      )}
    </div>
  );
}
