"use client";
import { useEffect, useState } from "react";
import { wa, defaultMsg, tel, site } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { PhoneIcon } from "./PhoneIcon";

// Celular: barra fixa com as três ações principais, depois que o topo da página sai da tela.
export function BarraAcoes({ guincho = "/#pedido-guincho" }: { guincho?: string }) {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const on = () => setVer(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!ver) return null;
  return (
    <nav aria-label="Ações rápidas" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-white/10 bg-asphalt/95 px-2 pt-2 backdrop-blur sm:hidden">
      <a href={guincho} className="flex min-h-12 items-center justify-center rounded-lg bg-alerta text-[15px] font-bold text-white">Guincho</a>
      <a href={wa(defaultMsg)} target="_blank" rel="noopener" data-origem="barra"
        className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-wa text-[15px] font-bold text-white">
        <WhatsAppIcon className="h-5 w-5" /> WhatsApp
      </a>
      <a href={tel} data-origem="barra" aria-label={`Ligar, ${site.phoneDisplay}`}
        className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg border-2 border-white/70 text-[15px] font-bold text-white">
        <PhoneIcon className="h-5 w-5" /> Ligar
      </a>
    </nav>
  );
}
