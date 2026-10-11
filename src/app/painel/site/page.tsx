import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diaBR } from "@/lib/painel";
import { papelAtual, ehGestao } from "@/lib/papel";
import { periodo, PERIODOS } from "@/lib/periodo";
import { Tile, Barras } from "@/components/Metricas";
import { card } from "@/components/ui";

type R = {
  visitas: number; whatsapp: number; ligacao: number; mapa: number; instagram: number;
  por_dia: { dia: string; visitas: number; contatos: number }[];
  por_origem: { origem: string; cliques: number }[];
  por_pagina: { pagina: string; visitas: number; contatos: number }[];
  por_fonte: { fonte: string; visitas: number; contatos: number }[];
  por_dispositivo: { dispositivo: string; visitas: number; contatos: number }[];
};

const ORIGEM: Record<string, string> = {
  hero: "Topo da página", cabecalho: "Botão do cabeçalho", flutuante: "Botão flutuante", "cotacao-hero": "Seletor de serviços",
  "cta-final": "Chamada final", local: "Seção de contato", guincho: "Pedido de guincho", pecas: "Pedido de peças", outro: "Outros",
};
const nomeOrigem = (o: string) =>
  ORIGEM[o] ?? (o.startsWith("servico-card:") ? `Cartão: ${o.slice(13)}` : o.startsWith("servico:") ? `Página: ${o.slice(8)}` : o);
const pct = (c: number, v: number) => (v > 0 ? `${((c / v) * 100).toFixed(1).replace(".", ",")}%` : "—");

export default async function SitePainel({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const per = periodo(p);
  const supabase = await createClient();
  if (!ehGestao(await papelAtual(supabase))) {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para dono e atendente.</p>;
  }
  const { data, error } = await supabase.rpc("resumo_site", { p_ini: per.ini, p_fim: per.fim });
  if (error || !data) throw new Error("Não foi possível carregar os números do site.");
  const r = data as R;
  const contatos = r.whatsapp + r.ligacao + r.mapa;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-bold">Site e conversões</h1>
      <p className="text-mute">Medido sem cookies e sem dados pessoais. Uma visita = uma página aberta por sessão do navegador.</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {PERIODOS.map(([k, l]) => (
          <Link key={k} href={`/painel/site?p=${k}`} aria-current={per.chave === k ? "page" : undefined}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${per.chave === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>{l}</Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile titulo="Visitas" valor={String(r.visitas)} />
        <Tile titulo="Cliques no WhatsApp" valor={String(r.whatsapp)} nota={`${pct(r.whatsapp, r.visitas)} das visitas`} />
        <Tile titulo="Rotas no mapa" valor={String(r.mapa)} />
        <Tile titulo="Instagram" valor={String(r.instagram)} />
      </div>
      {r.visitas === 0 && <p className="mt-4 text-mute">Ainda sem dados neste período. As visitas passam a aparecer assim que o site for acessado.</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">O que gera contato</h2>
          {r.por_origem.length === 0 ? <p className="mt-2 text-mute">Sem cliques no período.</p> :
            <Barras itens={r.por_origem.map((o) => ({ rotulo: nomeOrigem(o.origem), valor: o.cliques, texto: String(o.cliques) }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">De onde vêm</h2>
          {r.por_fonte.length === 0 ? <p className="mt-2 text-mute">Sem visitas no período.</p> :
            <Barras itens={r.por_fonte.map((f) => ({ rotulo: f.fonte, valor: f.visitas, texto: `${f.visitas} · ${pct(f.contatos, f.visitas)} contato` }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Páginas mais vistas</h2>
          {r.por_pagina.length === 0 ? <p className="mt-2 text-mute">Sem visitas no período.</p> :
            <Barras itens={r.por_pagina.map((x) => ({ rotulo: x.pagina, valor: x.visitas, texto: `${x.visitas} · ${x.contatos} contatos` }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Celular x computador</h2>
          {r.por_dispositivo.length === 0 ? <p className="mt-2 text-mute">Sem visitas no período.</p> :
            <Barras itens={r.por_dispositivo.map((d) => ({ rotulo: d.dispositivo === "mobile" ? "Celular" : d.dispositivo === "desktop" ? "Computador" : "Outros", valor: d.visitas, texto: `${d.visitas} visitas · ${pct(d.contatos, d.visitas)} contato` }))} />}
        </section>
      </div>

      <details className={`${card} mt-4`}>
        <summary className="min-h-11 cursor-pointer py-1 font-semibold text-brand">Ver dia a dia ({contatos} contatos no total)</summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead><tr className="border-b border-line"><th className="py-1">Dia</th><th>Visitas</th><th className="text-right">Contatos</th></tr></thead>
          <tbody>
            {r.por_dia.filter((d) => d.visitas > 0 || d.contatos > 0).map((d) => (
              <tr key={d.dia} className="border-b border-line/60"><td className="py-1">{diaBR(d.dia)}</td><td>{d.visitas}</td><td className="text-right">{d.contatos}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
