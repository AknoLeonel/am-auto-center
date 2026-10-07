"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { normPlaca } from "@/lib/painel";
import { input, btnPrimary, btnGhost, card } from "@/components/ui";

type Found = {
  id: string; placa: string; modelo: string | null; ano: number | null; km: number | null; cliente_id: string;
  clientes: { nome: string; telefone: string | null };
};

export default function NovaOS() {
  const router = useRouter();
  const [placa, setPlaca] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [searched, setSearched] = useState(false);
  const [f, setF] = useState({ nome: "", telefone: "", tipo: "carro", modelo: "", ano: "", km: "", defeito: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function buscar(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const p = normPlaca(placa);
    if (p.length !== 7) { setErr("Digite a placa completa, com 7 caracteres."); return; }
    setBusy(true);
    const { data, error } = await supabase.from("veiculos")
      .select("id,placa,modelo,ano,km,cliente_id,clientes(nome,telefone)").eq("placa", p).maybeSingle();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setFound((data as unknown as Found) ?? null);
    if (data?.km) set("km", String(data.km));
    setSearched(true);
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!found && !f.nome.trim()) { setErr("Informe o nome do cliente."); return; }
    setBusy(true);
    try {
      let clienteId = found?.cliente_id;
      let veiculoId = found?.id;
      if (!found) {
        const c = await supabase.from("clientes")
          .insert({ nome: f.nome.trim(), telefone: f.telefone.replace(/\D/g, "") || null }).select("id").single();
        if (c.error) throw c.error;
        clienteId = c.data.id;
        const v = await supabase.from("veiculos").insert({
          cliente_id: clienteId, placa: normPlaca(placa), tipo: f.tipo, modelo: f.modelo || null,
          ano: f.ano ? Number(f.ano) : null, km: f.km ? Number(f.km) : null,
        }).select("id").single();
        if (v.error) throw v.error;
        veiculoId = v.data.id;
      } else if (f.km) {
        await supabase.from("veiculos").update({ km: Number(f.km) }).eq("id", found.id);
      }
      const o = await supabase.from("ordens_servico").insert({
        cliente_id: clienteId, veiculo_id: veiculoId, defeito: f.defeito || null, km: f.km ? Number(f.km) : null,
      }).select("id").single();
      if (o.error) throw o.error;
      router.push(`/painel/os/${o.data.id}`);
    } catch (x) {
      setErr((x as { message?: string }).message ?? "Não foi possível salvar.");
      setBusy(false);
    }
  }

  const lbl = "mb-1 mt-3 block text-sm font-semibold";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Novo atendimento</h1>

      <form onSubmit={buscar} className="mt-4">
        <label htmlFor="placa" className="mb-1 block text-sm font-semibold">Placa do veículo</label>
        <div className="flex gap-2">
          <input id="placa" value={placa} onChange={(e) => { setPlaca(e.target.value.toUpperCase()); setSearched(false); setFound(null); }}
            maxLength={8} autoCapitalize="characters" placeholder="ABC1D23" className={`${input} font-display text-2xl tracking-widest`} />
          <button disabled={busy} className={btnPrimary}>Buscar</button>
        </div>
      </form>

      {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}

      {searched && (
        <form onSubmit={criar} className="mt-5">
          {found ? (
            <div className={card}>
              <p className="text-sm font-bold text-wa">Veículo já cadastrado</p>
              <p className="font-display text-2xl font-bold">{found.modelo || "Veículo"} {found.ano ?? ""}</p>
              <p className="text-mute">{found.clientes.nome}{found.clientes.telefone ? ` · ${found.clientes.telefone}` : ""}</p>
            </div>
          ) : (
            <div className={card}>
              <p className="text-sm font-bold text-brand">Placa nova: cadastre o cliente e o veículo</p>
              <label htmlFor="nome" className={lbl}>Nome do cliente</label>
              <input id="nome" className={input} value={f.nome} onChange={(e) => set("nome", e.target.value)} />
              <label htmlFor="tel" className={lbl}>WhatsApp (com DDD)</label>
              <input id="tel" inputMode="tel" placeholder="77 99999-9999" className={input} value={f.telefone} onChange={(e) => set("telefone", e.target.value)} />
              <label htmlFor="tipo" className={lbl}>Tipo</label>
              <select id="tipo" className={input} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
                <option value="carro">Carro</option><option value="moto">Moto</option>
                <option value="suv">SUV</option><option value="caminhao">Caminhão</option>
              </select>
              <div className="grid grid-cols-[1fr_6rem] gap-2">
                <div><label htmlFor="modelo" className={lbl}>Modelo</label>
                  <input id="modelo" className={input} placeholder="Ex.: Gol 1.0" value={f.modelo} onChange={(e) => set("modelo", e.target.value)} /></div>
                <div><label htmlFor="ano" className={lbl}>Ano</label>
                  <input id="ano" inputMode="numeric" className={input} value={f.ano} onChange={(e) => set("ano", e.target.value)} /></div>
              </div>
            </div>
          )}

          <label htmlFor="km" className={lbl}>Quilometragem atual</label>
          <input id="km" inputMode="numeric" className={input} value={f.km} onChange={(e) => set("km", e.target.value)} />
          <label htmlFor="defeito" className={lbl}>Defeito relatado pelo cliente</label>
          <textarea id="defeito" rows={3} className={input} value={f.defeito} onChange={(e) => set("defeito", e.target.value)} />

          <div className="mt-5 flex gap-2">
            <button disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? "Salvando..." : "Abrir ordem de serviço"}</button>
            <button type="button" className={btnGhost} onClick={() => router.push("/painel")}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
