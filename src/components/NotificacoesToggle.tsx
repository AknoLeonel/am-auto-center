"use client";
import { useEffect, useState } from "react";
import { salvarInscricao, removerInscricao } from "@/app/painel/mais/actions";
import { useToast } from "./ui/Toast";
import { btnPrimary, btnGhost, card } from "./ui";

type Estado = "carregando" | "sem-suporte" | "sem-chave" | "negado" | "inativo" | "ativo";

const paraBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export function NotificacoesToggle({ chavePublica }: { chavePublica: string | null }) {
  const toast = useToast();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setEstado("sem-suporte");
      if (!chavePublica) return setEstado("sem-chave");
      if (Notification.permission === "denied") return setEstado("negado");
      const reg = await navigator.serviceWorker.ready;
      setEstado((await reg.pushManager.getSubscription()) ? "ativo" : "inativo");
    })().catch(() => setEstado("sem-suporte"));
  }, [chavePublica]);

  async function ativar() {
    setOcupado(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") { setEstado("negado"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: paraBytes(chavePublica!) });
      const j = sub.toJSON();
      const r = await salvarInscricao({ endpoint: j.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth });
      if (r.erro) { await sub.unsubscribe(); toast.erro(r.erro); return; }
      setEstado("ativo");
      toast.ok("Notificações ativadas neste aparelho.");
    } catch {
      toast.erro("Não foi possível ativar as notificações.");
    } finally { setOcupado(false); }
  }

  async function desativar() {
    setOcupado(true);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) { await removerInscricao(sub.endpoint); await sub.unsubscribe(); }
      setEstado("inativo");
    } finally { setOcupado(false); }
  }

  const texto: Record<Estado, string> = {
    carregando: "Verificando...",
    "sem-suporte": "Este navegador não suporta notificações. No iPhone, instale o app na Tela de Início (iOS 16.4 ou mais novo).",
    "sem-chave": "As notificações ainda não foram configuradas no servidor.",
    negado: "As notificações estão bloqueadas. Libere nas configurações do navegador ou do aparelho.",
    inativo: "Receba um aviso no celular quando chegar pedido do site ou o cliente responder um orçamento, e o resumo do dia às 8h.",
    ativo: "Ativadas neste aparelho: pedidos do site, orçamentos respondidos e resumo do dia.",
  };

  return (
    <section className={card}>
      <h2 className="font-display text-2xl font-bold">Notificações</h2>
      <p className="text-sm text-mute">{texto[estado]}</p>
      {estado === "inativo" && <button type="button" disabled={ocupado} onClick={ativar} className={`${btnPrimary} mt-3 w-full`}>Ativar neste aparelho</button>}
      {estado === "ativo" && <button type="button" disabled={ocupado} onClick={desativar} className={`${btnGhost} mt-3 w-full`}>Desativar neste aparelho</button>}
    </section>
  );
}
