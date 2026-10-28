"use client";
import { useEffect, useState } from "react";
import { STATUS, statusLabel } from "@/lib/painel";
import { EVENTO, listar } from "@/lib/fila";
import { useEnviar } from "./useEnviar";

export function StatusOS({ osId, status }: { osId: string; status: string }) {
  const enviar = useEnviar();
  const [otimista, setOtimista] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const atual = otimista ?? status;

  // Quando a fila esvazia, volta a valer o que veio do servidor.
  useEffect(() => {
    const checar = async () => {
      const pend = (await listar()).some((o) => o.tipo === "status" && o.dados.os_id === osId && !o.erro);
      if (!pend) setOtimista(null);
    };
    window.addEventListener(EVENTO, checar);
    return () => window.removeEventListener(EVENTO, checar);
  }, [osId]);

  async function mudar(novo: string) {
    if (novo === atual || ocupado) return;
    setOcupado(true);
    setOtimista(novo);
    // "de" e "em": se outra pessoa mudar a OS antes de esta alteração subir, o servidor não a atropela.
    const r = await enviar("status", { os_id: osId, status: novo, de: atual, em: new Date().toISOString() });
    if (r.resultado === "erro") setOtimista(null);
    setOcupado(false);
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold">Situação: <span className="text-brand">{statusLabel(atual)}</span></p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STATUS.map(([k, l]) => (
          <button key={k} type="button" disabled={ocupado} aria-pressed={atual === k} onClick={() => mudar(k)}
            className={`min-h-12 rounded-lg border-2 px-2 text-sm font-bold ${atual === k ? "border-brand bg-brand text-white" : "border-line bg-white active:bg-paper"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
