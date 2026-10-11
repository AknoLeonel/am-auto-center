"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Medição de conversões do site público: sem cookies, sem identificador de pessoa e sem dados pessoais.
// Registra visita, cliques para WhatsApp/mapa/Instagram e de onde veio (UTM ou site de origem).
// Respeita "Não rastrear" (DNT) e Global Privacy Control. Não roda no painel nem em páginas com link-segredo.
const PRIVADO = /^\/(painel|login|o\/|acompanhar|offline|api)/;

type Tipo = "visita" | "whatsapp" | "mapa" | "instagram" | "ligacao";

const recusado = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === "1" || n.globalPrivacyControl === true;
};

function origemDaVisita() {
  try {
    const u = new URL(location.href);
    const guardado = JSON.parse(sessionStorage.getItem("am-origem") ?? "null");
    if (guardado) return guardado as Record<string, string>;
    const o: Record<string, string> = {};
    for (const [k, p] of [["fonte", "utm_source"], ["meio", "utm_medium"], ["campanha", "utm_campaign"]] as const) {
      const v = u.searchParams.get(p);
      if (v) o[k] = v.slice(0, 60);
    }
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname) o.ref = host.slice(0, 80);
    }
    sessionStorage.setItem("am-origem", JSON.stringify(o));
    return o;
  } catch { return {}; }
}

function enviar(evento: Tipo, origem: string | null) {
  const corpo = JSON.stringify({
    evento, origem, pagina: location.pathname.slice(0, 120), ...origemDaVisita(),
    dispositivo: matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
  });
  try {
    if (!navigator.sendBeacon?.("/api/evento", new Blob([corpo], { type: "application/json" }))) throw 0;
  } catch {
    fetch("/api/evento", { method: "POST", body: corpo, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}

const tipoDoLink = (href: string): Tipo | null => {
  if (href.startsWith("tel:")) return "ligacao";
  if (/^https?:\/\/(api\.whatsapp\.com|wa\.me)\//.test(href)) return "whatsapp";
  if (/^https?:\/\/(maps\.google\.com|www\.google\.com\/maps|goo\.gl\/maps)/.test(href)) return "mapa";
  if (/^https?:\/\/(www\.)?instagram\.com\//.test(href)) return "instagram";
  return null;
};

export function Rastreio() {
  const path = usePathname();

  useEffect(() => {
    if (PRIVADO.test(path) || recusado()) return;
    try {
      const k = `am-visita:${path}`;
      if (sessionStorage.getItem(k)) return; // uma visita por página por sessão
      sessionStorage.setItem(k, "1");
    } catch {}
    enviar("visita", null);
  }, [path]);

  useEffect(() => {
    if (PRIVADO.test(path) || recusado()) return;
    const clique = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const tipo = tipoDoLink(a.getAttribute("href") ?? "");
      if (!tipo) return;
      const origem = a.closest("[data-origem]")?.getAttribute("data-origem") ?? a.closest("section[id]")?.id ?? "outro";
      enviar(tipo, origem.slice(0, 60));
    };
    document.addEventListener("click", clique, { capture: true });
    return () => document.removeEventListener("click", clique, { capture: true });
  }, [path]);

  return null;
}
