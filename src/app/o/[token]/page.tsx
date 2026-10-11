import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { site, wa } from "@/lib/site";
import { brl, dataBR } from "@/lib/painel";
import { RespostaOrcamento } from "@/components/RespostaOrcamento";

export const metadata: Metadata = {
  title: "Seu orçamento | AM Auto Center",
  robots: { index: false, follow: false },
};

type Orc = {
  numero: number; placa: string; modelo: string | null; ano: number | null; cliente: string;
  itens: { descricao: string; tipo: string; qtd: number; valor_unit: number }[];
  total: number; status: "pendente" | "aprovado" | "recusado" | "substituido";
  aceite_nome: string | null; respondido_em: string | null; criado_em: string;
};

const AVISO: Record<string, [string, string]> = {
  aprovado: ["Orçamento aprovado", "Obrigado! Já avisamos a oficina e o serviço pode começar."],
  recusado: ["Orçamento recusado", "Tudo bem. Se mudar de ideia ou quiser ajustar valores, fale com a gente."],
  substituido: ["Este orçamento foi atualizado", "A oficina enviou uma versão mais nova. Peça o link novo pelo WhatsApp."],
};

export default async function OrcamentoPublico({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("orcamento_publico", { p_token: token });
  if (!data) notFound();
  const o = data as Orc;
  const veic = `${o.modelo || "Veículo"}${o.ano ? " " + o.ano : ""}`;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <p className="font-display text-2xl font-extrabold">AM <span className="text-brand">AUTO CENTER</span></p>
      <h1 className="mt-4 font-display text-4xl font-bold leading-none">Olá, {o.cliente}!</h1>
      <p className="mt-1 text-mute">Orçamento da OS {o.numero} · {dataBR(o.criado_em)}</p>

      <section className="mt-4 rounded-md border border-line bg-white p-4">
        <p className="font-display text-3xl font-bold leading-none">{o.placa}</p>
        <p className="font-semibold">{veic}</p>
        <ul className="mt-3 divide-y divide-line">
          {o.itens.map((i, n) => (
            <li key={n} className="flex justify-between gap-3 py-2">
              <span>
                {i.descricao}
                <span className="block text-sm text-mute">{i.tipo === "peca" ? "Peça" : "Serviço"} · {i.qtd}x {brl(i.valor_unit)}</span>
              </span>
              <span className="font-bold">{brl(i.qtd * i.valor_unit)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-line pt-3 font-display text-3xl font-bold">
          <span>Total</span><span>{brl(o.total)}</span>
        </p>
      </section>

      {o.status === "pendente" ? (
        <RespostaOrcamento token={token} />
      ) : (
        <div role="status" className="mt-6 rounded-md border-l-[6px] border-l-brand bg-white p-4">
          <p className="font-display text-2xl font-bold">{AVISO[o.status][0]}</p>
          <p className="text-mute">{AVISO[o.status][1]}</p>
          {o.aceite_nome && o.respondido_em && (
            <p className="mt-2 text-sm">Registrado por {o.aceite_nome} em {dataBR(o.respondido_em)}.</p>
          )}
        </div>
      )}

      <a href={wa(`Olá! Tenho uma dúvida sobre o orçamento da OS ${o.numero} (placa ${o.placa}).`)} target="_blank" rel="noopener"
        className="mt-6 block text-center font-semibold text-brand underline">Tirar dúvidas no WhatsApp</a>
      <p className="mt-6 text-center text-xs text-mute">{site.street} · {site.city}/{site.state}</p>
    </main>
  );
}
