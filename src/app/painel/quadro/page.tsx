import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATUS } from "@/lib/painel";
import { mudarStatus } from "../actions";
import { card } from "@/components/ui";

const COLUNAS = STATUS.filter(([k]) => k !== "entregue" && k !== "cancelada");

type Linha = {
  id: string; numero: number; status: string; defeito: string | null;
  clientes: { nome: string } | null; veiculos: { placa: string; modelo: string | null } | null;
};

export default async function Quadro() {
  const supabase = await createClient();
  const { data } = await supabase.from("ordens_servico")
    .select("id,numero,status,defeito,clientes(nome),veiculos(placa,modelo)")
    .in("status", COLUNAS.map(([k]) => k)).order("criado_em").limit(200);
  const rows = (data ?? []) as unknown as Linha[];

  return (
    <>
      <h1 className="font-display text-4xl font-bold">Quadro da oficina</h1>
      <p className="text-mute">Toque em &quot;Avançar&quot; para mover o carro para a próxima etapa.</p>

      <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
        {COLUNAS.map(([k, l], idx) => {
          const col = rows.filter((r) => r.status === k);
          const prox = COLUNAS[idx + 1] ?? (k === "pronto" ? (["entregue", "Entregue"] as const) : null);
          return (
            <section key={k} aria-label={l} className="w-[82vw] max-w-80 shrink-0 snap-start rounded-lg bg-line/40 p-2 sm:w-72">
              <h2 className="flex justify-between px-2 py-1 font-display text-2xl font-bold">
                {l}<span className="rounded-full bg-white px-2 text-base">{col.length}</span>
              </h2>
              <ul className="space-y-2">
                {col.map((r) => (
                  <li key={r.id} className={card}>
                    <Link href={`/painel/os/${r.id}`} className="block">
                      <span className="font-display text-2xl font-bold">{r.veiculos?.placa}</span>
                      <span className="block text-sm font-semibold">{r.veiculos?.modelo || "Veículo"} · {r.clientes?.nome}</span>
                      {r.defeito && <span className="line-clamp-2 text-sm text-mute">{r.defeito}</span>}
                    </Link>
                    {prox && (
                      <form action={mudarStatus} className="mt-2">
                        <input type="hidden" name="osId" value={r.id} />
                        <button name="status" value={prox[0]}
                          className="min-h-11 w-full rounded-lg bg-brand text-sm font-bold text-white active:brightness-90">Avançar: {prox[1]} →</button>
                      </form>
                    )}
                  </li>
                ))}
                {col.length === 0 && <li className="px-2 py-4 text-center text-sm text-mute">Nada aqui</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
