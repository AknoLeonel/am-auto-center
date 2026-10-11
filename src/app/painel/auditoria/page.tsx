import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TZ } from "@/lib/painel";
import { papelAtual } from "@/lib/papel";
import { card } from "@/components/ui";

const TABELAS: Record<string, string> = {
  ordens_servico: "Ordens", os_itens: "Itens da OS", clientes: "Clientes", veiculos: "Veículos",
  pecas_estoque: "Estoque", orcamentos: "Orçamentos", pagamentos: "Pagamentos", agendamentos: "Agenda",
};
const ACAO: Record<string, string> = { INSERT: "Criou", UPDATE: "Alterou", DELETE: "Apagou" };

type Ev = { id: number; em: string; user_id: string | null; tabela: string; registro_id: string; acao: string; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null };

const curto = (v: unknown) => {
  const s = v == null ? "vazio" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 50 ? `${s.slice(0, 50)}…` : s;
};

function resumo(e: Ev) {
  if (e.acao === "UPDATE" && e.antes && e.depois) {
    return Object.keys(e.depois).map((k) => `${k}: ${curto(e.antes![k])} → ${curto(e.depois![k])}`);
  }
  const base = (e.acao === "DELETE" ? e.antes : e.depois) ?? {};
  const rotulo = base.nome ?? base.descricao ?? base.placa ?? base.numero ?? base.valor;
  return [rotulo != null ? curto(rotulo) : `registro ${e.registro_id.slice(0, 8)}`];
}

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const supabase = await createClient();
  if ((await papelAtual(supabase)) !== "dono") {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para o dono da oficina.</p>;
  }
  const { t } = await searchParams;
  const tabela = t && t in TABELAS ? t : null;

  let q = supabase.from("auditoria").select("id,em,user_id,tabela,registro_id,acao,antes,depois").order("id", { ascending: false }).limit(100);
  if (tabela) q = q.eq("tabela", tabela);
  const [{ data }, eq] = await Promise.all([q, supabase.rpc("equipe_ativa")]);
  const eventos = (data ?? []) as Ev[];
  const quem = (id: string | null) => (eq.data as { user_id: string; nome: string }[] | null)?.find((e) => e.user_id === id)?.nome ?? (id ? "Usuário removido" : "Cliente / sistema");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Auditoria</h1>
      <p className="text-mute">Quem mudou o quê e quando. Os registros não podem ser editados nem apagados.</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[["", "Tudo"], ...Object.entries(TABELAS)].map(([k, l]) => (
          <Link key={k} href={k ? `/painel/auditoria?t=${k}` : "/painel/auditoria"} aria-current={(tabela ?? "") === k ? "page" : undefined}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${(tabela ?? "") === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>{l}</Link>
        ))}
      </div>

      {eventos.length === 0 ? <p className="mt-6 text-mute">Nada registrado ainda.</p> : (
        <ul className="mt-4 space-y-2">
          {eventos.map((e) => (
            <li key={e.id} className={card}>
              <p className="flex flex-wrap items-center justify-between gap-x-3 text-sm">
                <span><strong>{quem(e.user_id)}</strong> {ACAO[e.acao].toLowerCase()} em {TABELAS[e.tabela] ?? e.tabela}</span>
                <span className="text-mute">{new Date(e.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ })}</span>
              </p>
              <ul className="mt-1 text-sm text-mute">
                {resumo(e).map((l, i) => <li key={i} className="break-words">{l}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
