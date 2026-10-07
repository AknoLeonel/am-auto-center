"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { diaBR, mesesDepois } from "@/lib/painel";
import { input, btnPrimary, card } from "@/components/ui";

type L = { id: string; motivo: string; data_aviso: string; enviado: boolean };

const MOTIVOS = ["Troca de óleo", "Revisão dos freios", "Teste de bateria", "Alinhamento e balanceamento", "Revisão geral"];
const PRAZOS: [number, string][] = [[1, "1 mês"], [3, "3 meses"], [5, "5 meses"], [6, "6 meses"], [12, "1 ano"]];

export function LembreteForm({ osId }: { osId: string }) {
  const [lista, setLista] = useState<L[]>([]);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [meses, setMeses] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("lembretes").select("id,motivo,data_aviso,enviado").eq("os_id", osId).order("data_aviso");
    setLista((data ?? []) as L[]);
  }, [osId]);
  useEffect(() => { load(); }, [load]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const o = await supabase.from("ordens_servico").select("cliente_id,veiculo_id").eq("id", osId).single();
    if (o.error) { setErr("Não foi possível ler a ordem."); setBusy(false); return; }
    const r = await supabase.from("lembretes").insert({
      cliente_id: o.data.cliente_id, veiculo_id: o.data.veiculo_id, os_id: osId, motivo, data_aviso: mesesDepois(meses),
    });
    if (r.error) setErr(r.error.message);
    setBusy(false);
    load();
  }

  async function remover(id: string) {
    await supabase.from("lembretes").delete().eq("id", id);
    load();
  }

  return (
    <section className={card}>
      <h2 className="font-display text-3xl font-bold">Lembrar o cliente de voltar</h2>
      <p className="text-sm text-mute">Na data marcada, o cliente aparece na tela Retornos com a mensagem pronta.</p>

      <form onSubmit={criar} className="mt-3">
        <label htmlFor="motivo" className="mb-1 block text-sm font-semibold">Motivo</label>
        <select id="motivo" className={input} value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          {MOTIVOS.map((m) => <option key={m}>{m}</option>)}
        </select>

        <p className="mb-1 mt-3 text-sm font-semibold">Avisar em</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Prazo">
          {PRAZOS.map(([m, l]) => (
            <button key={m} type="button" aria-pressed={meses === m} onClick={() => setMeses(m)}
              className={`min-h-11 rounded-full border-2 px-4 text-sm font-semibold ${meses === m ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{l}</button>
          ))}
        </div>

        {err && <p role="alert" className="mt-2 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className={`${btnPrimary} mt-4 w-full`}>{busy ? "Salvando..." : "Agendar lembrete"}</button>
      </form>

      {lista.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {lista.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{l.motivo}</span>
                <span className="block text-sm text-mute">{l.enviado ? "Já avisado" : `Avisar em ${diaBR(l.data_aviso)}`}</span>
              </span>
              <button type="button" onClick={() => remover(l.id)} aria-label={`Remover lembrete ${l.motivo}`} className="h-10 w-10 text-xl text-red-700">×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
