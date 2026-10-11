"use client";
import { useState } from "react";
import { useEnviar } from "./useEnviar";
import { input, btnPrimary, card } from "./ui";

export function ObsOS({ osId, inicial }: { osId: string; inicial: string }) {
  const enviar = useEnviar();
  const [texto, setTexto] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    await enviar("obs", { os_id: osId, obs: texto }, undefined, "Observações salvas.");
    setOcupado(false);
  }

  return (
    <form onSubmit={salvar} className={card}>
      <label htmlFor="obs" className="font-display text-3xl font-bold">Observações internas</label>
      <textarea id="obs" rows={3} maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)} className={`${input} mt-2`} />
      <button disabled={ocupado} className={`${btnPrimary} mt-3`}>{ocupado ? "Salvando..." : "Salvar observações"}</button>
    </form>
  );
}
