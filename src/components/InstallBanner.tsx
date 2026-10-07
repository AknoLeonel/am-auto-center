"use client";
import { useEffect, useState } from "react";
import { btnPrimary } from "./ui";

type BIP = Event & { prompt: () => Promise<void> };

export function InstallBanner() {
  const [ev, setEv] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [hide, setHide] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    let off = false;
    try { off = localStorage.getItem("am-install-off") === "1"; } catch {}
    if (standalone || off) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHide(false);
    const on = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  if (hide || (!ev && !ios)) return null;

  function fechar() {
    try { localStorage.setItem("am-install-off", "1"); } catch {}
    setHide(true);
  }

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-md border border-brand bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-2xl font-bold leading-tight">Instale o painel no seu celular</p>
        <p className="text-sm text-mute">
          {ev ? "Abre em tela cheia, direto da tela inicial, como um aplicativo." : "No iPhone: toque em Compartilhar e depois em Adicionar à Tela de Início."}
        </p>
      </div>
      <div className="flex gap-2">
        {ev && (
          <button type="button" className={btnPrimary} onClick={async () => { await ev.prompt(); setEv(null); }}>Instalar app</button>
        )}
        <button type="button" onClick={fechar} className="min-h-12 px-3 text-sm font-semibold text-mute underline">Agora não</button>
      </div>
    </div>
  );
}
