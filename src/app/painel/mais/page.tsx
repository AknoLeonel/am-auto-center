import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { card } from "@/components/ui";

const ITENS: [string, string, string][] = [
  ["/painel/pedidos", "Pedidos do site", "Peças, guincho e orçamentos enviados pelos clientes"],
  ["/painel/retornos", "Retornos", "Clientes que precisam voltar à oficina"],
  ["/painel/estoque", "Estoque", "Peças, preços e alerta de estoque baixo"],
];

export default async function Mais() {
  const supabase = await createClient();
  const { count } = await supabase.from("pedidos_site").select("id", { count: "exact", head: true }).eq("status", "novo");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Mais</h1>
      <ul className="mt-4 space-y-3">
        {ITENS.map(([h, t, d]) => (
          <li key={h}>
            <Link href={h} className={`${card} flex min-h-16 items-center justify-between gap-3 hover:border-brand`}>
              <span>
                <span className="block font-display text-2xl font-bold">{t}</span>
                <span className="text-sm text-mute">{d}</span>
              </span>
              {h === "/painel/pedidos" && !!count && <span className="rounded-full bg-red-600 px-2 text-sm font-bold text-white">{count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
