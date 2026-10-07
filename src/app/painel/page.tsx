"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { STATUS, statusLabel, dataBR } from "@/lib/painel";
import { input, btnPrimary, card } from "@/components/ui";

type Row = {
  id: string; numero: number; status: string; defeito: string | null; criado_em: string;
  clientes: { nome: string } | null; veiculos: { placa: string; modelo: string | null } | null;
};

export default function Ordens() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("abertas");

  useEffect(() => {
    supabase
      .from("ordens_servico")
      .select("id,numero,status,defeito,criado_em,clientes(nome),veiculos(placa,modelo)")
      .order("criado_em", { ascending: false })
      .limit(300)
      .then(({ data }) => { setRows((data ?? []) as unknown as Row[]); setLoading(false); });
  }, []);

  const lista = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const aberta = !["entregue", "cancelada"].includes(r.status);
      if (filtro === "abertas" ? !aberta : filtro !== "todas" && r.status !== filtro) return false;
      if (!nq) return true;
      return `${r.veiculos?.placa} ${r.veiculos?.modelo} ${r.clientes?.nome} ${r.numero}`.toLowerCase().includes(nq);
    });
  }, [rows, q, filtro]);

  const chips: [string, string][] = [["abertas", "Abertas"], ...STATUS.map(([k, l]) => [k, l] as [string, string]), ["todas", "Todas"]];

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold">Ordens de serviço</h1>
        <Link href="/painel/nova" className={btnPrimary}>Nova OS</Link>
      </div>

      <label htmlFor="q" className="sr-only">Buscar</label>
      <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por placa, cliente ou número" className={`${input} mt-4`} />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {chips.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={filtro === k} onClick={() => setFiltro(k)}
            className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold ${filtro === k ? "border-asphalt bg-asphalt text-white" : "border-line bg-white"}`}>{l}</button>
        ))}
      </div>

      {loading ? <p className="mt-6 text-mute">Carregando...</p> : lista.length === 0 ? (
        <p className="mt-6 text-mute">Nenhuma ordem encontrada. Toque em Nova OS para registrar o primeiro atendimento.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lista.map((r) => (
            <li key={r.id}>
              <Link href={`/painel/os/${r.id}`} className={`${card} block hover:border-brand`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-3xl font-bold leading-none">{r.veiculos?.placa}</span>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{statusLabel(r.status)}</span>
                </div>
                <p className="mt-1 font-semibold">{r.veiculos?.modelo || "Veículo"} · {r.clientes?.nome}</p>
                {r.defeito && <p className="mt-1 line-clamp-2 text-sm text-mute">{r.defeito}</p>}
                <p className="mt-2 text-xs text-mute">OS {r.numero} · {dataBR(r.criado_em)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
