import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brl } from "@/lib/painel";
import { ajustarEstoque } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, btnPrimary, btnGhost, card } from "@/components/ui";

type P = { id: string; nome: string; codigo: string | null; qtd: number; minimo: number; custo: number; preco: number; ativo: boolean };

export default async function Estoque({ searchParams }: { searchParams: Promise<{ q?: string; baixo?: string; arq?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const arquivadas = sp.arq === "1";

  const supabase = await createClient();
  let query = supabase.from("pecas_estoque").select("id,nome,codigo,qtd,minimo,custo,preco,ativo")
    .eq("ativo", !arquivadas).order("nome").limit(300);
  if (q) query = query.ilike("nome", `%${q.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const todas = ((data ?? []) as P[]).map((p) => ({ ...p, qtd: Number(p.qtd), minimo: Number(p.minimo), custo: Number(p.custo), preco: Number(p.preco) }));
  const baixo = sp.baixo === "1";
  const lista = baixo ? todas.filter((p) => p.qtd <= p.minimo) : todas;
  const qtdBaixo = todas.filter((p) => p.qtd <= p.minimo).length;
  const valorEstoque = todas.reduce((s, p) => s + p.qtd * p.custo, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Estoque</h1>
        <Link href="/painel/estoque/nova" className={btnPrimary}>Nova peça</Link>
      </div>
      <p className="text-mute">{todas.length} peças · valor a custo {brl(valorEstoque)}</p>

      <form action="/painel/estoque" className="mt-4 flex gap-2" role="search">
        {baixo && <input type="hidden" name="baixo" value="1" />}
        {arquivadas && <input type="hidden" name="arq" value="1" />}
        <label htmlFor="q" className="sr-only">Buscar peça</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar peça" className={input} />
        <button className={`${btnPrimary} shrink-0`}>Buscar</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link href="/painel/estoque" aria-current={!baixo && !arquivadas ? "page" : undefined}
          className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${!baixo && !arquivadas ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>Todas</Link>
        <Link href="/painel/estoque?baixo=1" aria-current={baixo ? "page" : undefined}
          className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${baixo ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>Acabando ({qtdBaixo})</Link>
        <Link href="/painel/estoque?arq=1" aria-current={arquivadas ? "page" : undefined}
          className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${arquivadas ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>Arquivadas</Link>
      </div>

      {lista.length === 0 ? <p className="mt-6 text-mute">Nenhuma peça por aqui.</p> : (
        <ul className="mt-4 space-y-3">
          {lista.map((p) => {
            const acabando = p.qtd <= p.minimo;
            return (
              <li key={p.id} className={`${card} ${acabando && !arquivadas ? "border-l-[6px] border-l-red-600" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/painel/estoque/${p.id}`} className="font-semibold hover:text-brand">{p.nome}</Link>
                    <p className="text-sm text-mute">{p.codigo ? `${p.codigo} · ` : ""}custo {brl(p.custo)} · venda {brl(p.preco)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${acabando ? "bg-red-600 text-white" : "bg-brand/10 text-brand"}`}>{p.qtd} un.</span>
                </div>
                <form action={ajustarEstoque} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="delta" inputMode="decimal" aria-label={`Entrada ou correção de ${p.nome}`} placeholder="+10 ou -2" className={input} />
                  <SubmitButton pendente="..." className={`${btnGhost} shrink-0`}>Ajustar</SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
