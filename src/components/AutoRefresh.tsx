"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Para páginas públicas (sem login, sem Realtime): atualiza os dados a cada N segundos, só com a aba visível.
export function AutoRefresh({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}
