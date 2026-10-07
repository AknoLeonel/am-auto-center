"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { input, card } from "@/components/ui";

type P = { id: string; tipo: string; nome: string | null; veiculo: string | null; mensagem: string; status: string; criado_em: string };

const FILTROS: [string, string][] = [["novo", "Novos"], ["em_atendimento", "Em atendimento"], ["concluido", "Concluídos"], ["descartado", "Descartados"]];
const TIPO: Record<string, string> = { pecas: "Peças", guincho: "Guincho", orcamento: "Orçamento" };

export default function Pedidos() {
  const [rows, setRows] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("novo");

  const load = useCallback(async () => {
    const { data } = await supabase.from("pedidos_site")
      .select("id,tipo,nome,veiculo,mensagem,status,criado_em").order("criado_em", { ascending: false }).limit(200);
    setRows((data ?? []) as P[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // atualiza sozinho a cada 30s
    return () => clearInterval(t);
  }, [load]);

  async function mudar(id: string, status: string) {
    await supabase.from("pedidos_site").update({ status }).eq("id", id);
    load();
  }

  const lista = rows.filter((r) => r.status === filtro);
  const cont = (k: string) => rows.filter((r) => r.status === k).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Pedidos do site</h1>
      <p className="text-mute">Peças, guincho e orçamentos que os clientes enviaram pelo site. A conversa continua no WhatsApp da oficina.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${filtro === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>
            {l} ({cont(k)})
          </button>
        ))}
      </div>

      {loading ? <p className="mt-6 text-mute">Carregando...</p> : lista.length === 0 ? (
        <p className="mt-6 text-mute">Nenhum pedido nesta fila.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lista.map((p) => (
            <li key={p.id} className={`${card} ${p.tipo === "guincho" ? "border-l-[6px] border-l-red-600" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.tipo === "guincho" ? "bg-red-600 text-white" : "bg-brand/10 text-brand"}`}>{TIPO[p.tipo] ?? p.tipo}</span>
                <span className="text-xs text-mute">{new Date(p.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
              {(p.nome || p.veiculo) && <p className="mt-2 font-semibold">{[p.nome, p.veiculo].filter(Boolean).join(" · ")}</p>}
              <p className="mt-2 whitespace-pre-line rounded-md bg-paper p-3 text-sm">{p.mensagem}</p>
              <label htmlFor={`s-${p.id}`} className="mb-1 mt-3 block text-sm font-semibold">Situação</label>
              <select id={`s-${p.id}`} className={input} value={p.status} onChange={(e) => mudar(p.id, e.target.value)}>
                {FILTROS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
