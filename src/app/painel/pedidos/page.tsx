import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mudarPedido } from "../actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { card } from "@/components/ui";

type P = { id: string; tipo: string; nome: string | null; veiculo: string | null; mensagem: string; status: string; criado_em: string };

const FILTROS: [string, string][] = [["novo", "Novos"], ["em_atendimento", "Em atendimento"], ["concluido", "Concluídos"], ["descartado", "Descartados"]];
const TIPO: Record<string, string> = { pecas: "Peças", guincho: "Guincho", orcamento: "Orçamento" };

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const filtro = FILTROS.some(([k]) => k === s) ? s! : "novo";

  const supabase = await createClient();
  const { data } = await supabase.from("pedidos_site")
    .select("id,tipo,nome,veiculo,mensagem,status,criado_em").order("criado_em", { ascending: false }).limit(200);
  const rows = (data ?? []) as P[];
  const lista = rows.filter((r) => r.status === filtro);
  const cont = (k: string) => rows.filter((r) => r.status === k).length;

  return (
    <div className="mx-auto max-w-2xl">
      <AutoRefresh />
      <h1 className="font-display text-4xl font-bold">Pedidos do site</h1>
      <p className="text-mute">Peças, guincho e orçamentos que os clientes enviaram pelo site. A conversa continua no WhatsApp da oficina.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(([k, l]) => (
          <Link key={k} href={`/painel/pedidos?s=${k}`} aria-current={filtro === k ? "page" : undefined}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${filtro === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>
            {l} ({cont(k)})
          </Link>
        ))}
      </div>

      {lista.length === 0 ? <p className="mt-6 text-mute">Nenhum pedido nesta fila.</p> : (
        <ul className="mt-4 space-y-3">
          {lista.map((p) => (
            <li key={p.id} className={`${card} ${p.tipo === "guincho" ? "border-l-[6px] border-l-red-600" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.tipo === "guincho" ? "bg-red-600 text-white" : "bg-brand/10 text-brand"}`}>{TIPO[p.tipo] ?? p.tipo}</span>
                <span className="text-xs text-mute">{new Date(p.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Bahia" })}</span>
              </div>
              {(p.nome || p.veiculo) && <p className="mt-2 font-semibold">{[p.nome, p.veiculo].filter(Boolean).join(" · ")}</p>}
              <p className="mt-2 whitespace-pre-line rounded-md bg-paper p-3 text-sm">{p.mensagem}</p>
              <form action={mudarPedido} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="id" value={p.id} />
                {FILTROS.filter(([k]) => k !== p.status).map(([k, l]) => (
                  <button key={k} name="status" value={k}
                    className="min-h-11 rounded-lg border-2 border-line bg-white px-2 text-sm font-semibold active:bg-paper">{l}</button>
                ))}
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
