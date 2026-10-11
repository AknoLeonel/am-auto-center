import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brl, statusLabel } from "@/lib/painel";
import { papelAtual } from "@/lib/papel";
import { periodo, PERIODOS } from "@/lib/periodo";
import { GraficoReceita } from "@/components/GraficoReceita";
import { Tile, Barras } from "@/components/Metricas";
import { card } from "@/components/ui";

type Dash = {
  os_entregues: number; receita: number; custo: number; margem: number; ticket_medio: number; horas_medias: number | null;
  recebido: number; a_receber: number; orcamentos_aprovados: number; orcamentos_recusados: number; clientes_retorno: number;
  por_dia: { dia: string; receita: number; os: number }[];
  por_forma: { forma: string; valor: number }[];
  top_servicos: { nome: string; qtd: number; receita: number }[];
  por_mecanico: { nome: string; os: number; receita: number }[];
  etapas: { etapa: string; horas: number; n: number }[];
};

const FORMA: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", debito: "Débito", credito: "Crédito", transferencia: "Transferência" };
const horas = (h: number | null) => (h == null ? "—" : h < 48 ? `${h < 10 ? h.toFixed(1).replace(".", ",") : Math.round(h)} h` : `${(h / 24).toFixed(1).replace(".", ",")} dias`);

export default async function Financeiro({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const per = periodo(p);
  const supabase = await createClient();

  if ((await papelAtual(supabase)) !== "dono") {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para o dono da oficina.</p>;
  }

  const { data, error } = await supabase.rpc("dashboard", { p_ini: per.ini, p_fim: per.fim });
  if (error || !data) throw new Error("Não foi possível carregar os números do período.");
  const d = data as Dash;
  const aprov = d.orcamentos_aprovados + d.orcamentos_recusados;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-bold">Financeiro</h1>
      <p className="text-mute">Receita conta pela data de entrega da OS. Custo considera só as peças do estoque.</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {PERIODOS.map(([k, l]) => (
          <Link key={k} href={`/painel/financeiro?p=${k}`} aria-current={per.chave === k ? "page" : undefined}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${per.chave === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>{l}</Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile titulo="Receita" valor={brl(d.receita)} nota={`${d.os_entregues} OS entregues`} />
        <Tile titulo="Margem" valor={brl(d.margem)} nota={d.receita > 0 ? `${Math.round((d.margem / d.receita) * 100)}% da receita` : undefined} />
        <Tile titulo="Ticket médio" valor={brl(d.ticket_medio)} />
        <Tile titulo="Tempo médio" valor={horas(d.horas_medias)} nota="da entrada à entrega" />
        <Tile titulo="Recebido" valor={brl(d.recebido)} nota="pagamentos no período" />
        <Link href="/painel/financeiro/receber" className="contents">
          <div className={`${card} border-l-[6px] ${d.a_receber > 0 ? "border-l-red-600" : "border-l-wa"}`}>
            <p className="text-sm font-semibold text-mute">A receber</p>
            <p className="font-display text-4xl font-bold leading-none tabular-nums">{brl(d.a_receber)}</p>
            <p className="mt-1 text-xs font-semibold text-brand">Ver contas →</p>
          </div>
        </Link>
        <Tile titulo="Aprovação de orçamentos" valor={aprov ? `${Math.round((d.orcamentos_aprovados / aprov) * 100)}%` : "—"} nota={aprov ? `${d.orcamentos_aprovados} de ${aprov}` : "nenhum respondido"} />
        <Tile titulo="Clientes que voltaram" valor={String(d.clientes_retorno)} nota="já tinham passado antes" />
      </div>

      <section className={`${card} mt-4`}>
        <h2 className="font-display text-3xl font-bold">Receita por dia</h2>
        <GraficoReceita dias={d.por_dia} />
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Mais vendidos</h2>
          {d.top_servicos.length === 0 ? <p className="mt-2 text-mute">Sem vendas no período.</p> :
            <Barras itens={d.top_servicos.map((s) => ({ rotulo: s.nome, valor: s.receita, texto: brl(s.receita) }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Como receberam</h2>
          {d.por_forma.length === 0 ? <p className="mt-2 text-mute">Sem pagamentos no período.</p> :
            <Barras itens={d.por_forma.map((f) => ({ rotulo: FORMA[f.forma] ?? f.forma, valor: f.valor, texto: brl(f.valor) }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Por mecânico</h2>
          {d.por_mecanico.length === 0 ? <p className="mt-2 text-mute">Sem entregas no período.</p> :
            <Barras itens={d.por_mecanico.map((m) => ({ rotulo: m.nome, valor: m.receita, texto: `${brl(m.receita)} · ${m.os} OS` }))} />}
        </section>
        <section className={card}>
          <h2 className="font-display text-3xl font-bold">Tempo em cada etapa</h2>
          {d.etapas.length === 0 ? <p className="mt-2 text-mute">Ainda sem histórico suficiente.</p> :
            <Barras itens={d.etapas.map((e) => ({ rotulo: statusLabel(e.etapa), valor: e.horas, texto: horas(e.horas) }))} />}
        </section>
      </div>
    </div>
  );
}
