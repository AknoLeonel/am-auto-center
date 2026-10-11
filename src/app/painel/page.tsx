import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/painel";
import { OSCard, type OSResumo } from "@/components/OSCard";
import { input, btnPrimary } from "@/components/ui";

const POR_PAGINA = 20;
const FILTROS: [string, string][] = [["abertas", "Abertas"], ...STATUS.map(([k, l]) => [k, l] as [string, string]), ["todas", "Todas"]];

type SP = { q?: string; f?: string; antes?: string };

const href = (p: SP) => {
  const u = new URLSearchParams();
  if (p.q) u.set("q", p.q);
  if (p.f && p.f !== "abertas") u.set("f", p.f);
  if (p.antes) u.set("antes", p.antes);
  const s = u.toString();
  return `/painel${s ? `?${s}` : ""}`;
};

export default async function Ordens({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const f = FILTROS.some(([k]) => k === sp.f) ? sp.f! : "abertas";
  const antes = sp.antes && !Number.isNaN(Date.parse(sp.antes)) ? sp.antes : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listar_os", {
    p_busca: q || null, p_filtro: f, p_limite: POR_PAGINA + 1, p_antes: antes,
  });
  if (error) throw new Error("Não foi possível carregar as ordens.");

  const rows = (data ?? []) as OSResumo[];
  const lista = rows.slice(0, POR_PAGINA);
  const proxima = rows.length > POR_PAGINA ? lista[lista.length - 1].criado_em : null;

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Ordens de serviço</h1>
        <Link href="/painel/nova" className={btnPrimary}>Nova OS</Link>
      </div>

      <form action="/painel" className="mt-4 flex gap-2" role="search">
        {f !== "abertas" && <input type="hidden" name="f" value={f} />}
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Placa, cliente, modelo ou nº da OS" className={input} />
        <button className={`${btnPrimary} shrink-0`}>Buscar</button>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(([k, l]) => (
          <Link key={k} href={href({ q, f: k })} aria-current={f === k ? "page" : undefined}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${f === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>{l}</Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-mute">
          {q || antes ? "Nenhuma ordem encontrada com esse filtro." : "Nenhuma ordem por aqui. Toque em Nova OS para registrar o primeiro atendimento."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lista.map((r) => <li key={r.id}><OSCard r={r} /></li>)}
        </ul>
      )}

      {(proxima || antes) && (
        <nav aria-label="Páginas" className="mt-6 flex justify-between gap-3">
          {antes ? <Link href={href({ q, f })} className="font-semibold text-brand">← Mais recentes</Link> : <span />}
          {proxima && <Link href={href({ q, f, antes: proxima })} className="font-semibold text-brand">Mais antigas →</Link>}
        </nav>
      )}
    </>
  );
}
