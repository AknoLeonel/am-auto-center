"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Atualiza os dados do servidor a cada N segundos, só com a aba visível (Realtime vem na Fase 4).
export function AutoRefresh({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);
  return null;
}
