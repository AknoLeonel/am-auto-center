"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./ui/Toast";

const TABELAS = ["ordens_servico", "os_itens", "pedidos_site", "orcamentos", "agendamentos"] as const;

// Mantém o painel igual para todo mundo: quando algo muda no banco, a tela se atualiza sozinha.
// O Realtime respeita o RLS (cada usuário só recebe o que pode ler). Se a conexão cair, volta a atualizar de 30 em 30 s.
export function TempoReal() {
  const router = useRouter();
  const toast = useToast();
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;
    // Junta rajadas de mudanças (ex.: vários itens seguidos) numa atualização só.
    const atualizar = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 700); };

    let canal = supabase.channel("painel");
    for (const t of TABELAS) canal = canal.on("postgres_changes", { event: "*", schema: "public", table: t }, atualizar);
    canal = canal.on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos_site" }, () => {
      toast.ok("Novo pedido do site!");
      try { navigator.vibrate?.(200); } catch {}
    });
    canal.subscribe((estado) => setConectado(estado === "SUBSCRIBED"));

    return () => { clearTimeout(timer); supabase.removeChannel(canal); };
  }, [router, toast]);

  useEffect(() => {
    if (conectado) return;
    const t = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) router.refresh(); }, 30000);
    return () => clearInterval(t);
  }, [conectado, router]);

  return null;
}
