import Link from "next/link";
import { statusLabel, dataBR } from "@/lib/painel";
import { card } from "./ui";

export type OSResumo = {
  id: string; numero: number; status: string; defeito: string | null; criado_em: string;
  placa: string; modelo: string | null; cliente_nome: string;
};

export function OSCard({ r }: { r: OSResumo }) {
  return (
    <Link href={`/painel/os/${r.id}`} className={`${card} block transition-colors hover:border-brand active:bg-paper`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-3xl font-bold leading-none">{r.placa}</span>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">{statusLabel(r.status)}</span>
      </div>
      <p className="mt-1 font-semibold">{r.modelo || "Veículo"} · {r.cliente_nome}</p>
      {r.defeito && <p className="mt-1 line-clamp-2 text-sm text-mute">{r.defeito}</p>}
      <p className="mt-2 text-xs text-mute">OS {r.numero} · {dataBR(r.criado_em)}</p>
    </Link>
  );
}
