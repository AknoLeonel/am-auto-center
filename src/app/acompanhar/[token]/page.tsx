import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { site, wa } from "@/lib/site";
import { STATUS, statusLabel, TZ } from "@/lib/painel";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata: Metadata = {
  title: "Acompanhe seu carro",
  robots: { index: false, follow: false },
};

type Dados = {
  numero: number; placa: string; modelo: string | null; ano: number | null; cliente: string;
  status: string; criado_em: string; entregue_em: string | null; garantia_dias: number;
  etapas: { status: string; em: string }[]; orcamento_token: string | null;
};

// Etapas que o cliente enxerga, em ordem. "Cancelada" fica de fora do passo a passo.
const PASSOS: string[] = STATUS.filter(([k]) => k !== "cancelada").map(([k]) => k);

const FRASE: Record<string, string> = {
  aguardando: "Recebemos seu carro e ele está na fila de atendimento.",
  diagnostico: "Nossos mecânicos estão avaliando o problema.",
  aprovacao: "O orçamento está pronto e aguarda a sua aprovação.",
  em_servico: "Seu carro está sendo consertado agora.",
  pronto: "Seu carro está pronto! Pode vir retirar.",
  entregue: "Serviço entregue. Obrigado pela confiança!",
  cancelada: "Esta ordem de serviço foi cancelada. Fale com a gente se precisar.",
};

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ });

export default async function Acompanhar({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("acompanhar_publico", { p_token: token });
  if (!data) notFound();
  const o = data as Dados;

  const atual = PASSOS.indexOf(o.status);
  // Data em que cada etapa começou (a última vez que entrou nela)
  const inicio = new Map<string, string>();
  for (const e of o.etapas) inicio.set(e.status, e.em);
  const veic = `${o.modelo || "Veículo"}${o.ano ? " " + o.ano : ""}`;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <AutoRefresh segundos={60} />
      <p className="font-display text-2xl font-extrabold">AM <span className="text-brand">AUTO CENTER</span></p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-none">Olá, {o.cliente}!</h1>
      <p className="mt-1 text-mute">Acompanhe seu {veic} · placa <strong className="text-ink">{o.placa}</strong></p>

      <section aria-live="polite" className="mt-4 rounded-md border-l-[6px] border-l-brand bg-white p-4">
        <p className="text-sm font-semibold text-mute">Agora</p>
        <p className="font-display text-3xl font-bold leading-tight">{statusLabel(o.status)}</p>
        <p>{FRASE[o.status]}</p>
      </section>

      {o.orcamento_token && (
        <Link href={`/o/${o.orcamento_token}`}
          className="mt-4 flex min-h-14 items-center justify-center rounded-lg bg-wa px-5 text-lg font-bold text-white">
          Ver e aprovar o orçamento
        </Link>
      )}

      {o.status !== "cancelada" && (
        <ol className="mt-6 border-l-2 border-line pl-5">
          {PASSOS.map((k, i) => {
            const feito = i < atual || (i === atual && (k === "entregue"));
            const agora = i === atual && k !== "entregue";
            return (
              <li key={k} className="relative pb-5" aria-current={agora ? "step" : undefined}>
                <span aria-hidden className={`absolute -left-[29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${feito ? "bg-wa" : agora ? "bg-brand ring-4 ring-brand/25" : "bg-line"}`}>
                  {feito ? "✓" : ""}
                </span>
                <p className={`font-semibold ${feito || agora ? "" : "text-mute"}`}>{statusLabel(k)}</p>
                {inicio.has(k) && (feito || agora) && <p className="text-sm text-mute">{quando(inicio.get(k)!)}</p>}
              </li>
            );
          })}
        </ol>
      )}

      {o.status === "entregue" && o.garantia_dias > 0 && (
        <p className="mt-2 rounded-md bg-white p-3 text-sm">Garantia do serviço: <strong>{o.garantia_dias} dias</strong> a partir da entrega.</p>
      )}

      <a href={wa(`Olá! Quero saber do meu carro (placa ${o.placa}, OS ${o.numero}).`)} target="_blank" rel="noopener"
        className="mt-6 block text-center font-semibold text-brand underline">Falar com a oficina no WhatsApp</a>
      <p className="mt-6 text-center text-xs text-mute">{site.street} · {site.city}/{site.state} · atualiza sozinho</p>
    </main>
  );
}
