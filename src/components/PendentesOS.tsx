"use client";
import { useFila } from "./useFila";
import { brl } from "@/lib/painel";
import { statusLabel } from "@/lib/painel";

// O que foi feito nesta OS e ainda não chegou ao servidor (sem sinal).
export function PendentesOS({ osId }: { osId: string }) {
  const ops = useFila().filter((o) => o.dados.os_id === osId && !o.erro);
  if (ops.length === 0) return null;
  const nome = (o: (typeof ops)[number]) =>
    o.tipo === "status" ? `Situação → ${statusLabel(String(o.dados.status))}`
    : o.tipo === "item" ? `Item: ${String(o.dados.descricao)} (${brl(Number(o.dados.qtd) * Number(o.dados.valor))})`
    : o.tipo === "obs" ? "Observações atualizadas" : "Foto";
  return (
    <section role="status" className="rounded-md border-l-[6px] border-l-amber-500 bg-amber-50 p-3 text-sm">
      <p className="font-bold text-amber-900">Aguardando envio ({ops.length})</p>
      <ul className="mt-1 list-disc pl-5 text-amber-900">{ops.map((o) => <li key={o.id}>{nome(o)}</li>)}</ul>
    </section>
  );
}
