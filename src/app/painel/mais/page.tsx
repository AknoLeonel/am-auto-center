import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { papelAtual, ehGestao } from "@/lib/papel";
import { NotificacoesToggle } from "@/components/NotificacoesToggle";
import { card } from "@/components/ui";

type Item = [href: string, titulo: string, desc: string, quem: "todos" | "gestao" | "dono"];

const ITENS: Item[] = [
  ["/painel/pedidos", "Pedidos do site", "Peças, guincho e orçamentos enviados pelos clientes", "todos"],
  ["/painel/retornos", "Retornos", "Clientes que precisam voltar à oficina", "todos"],
  ["/painel/estoque", "Estoque", "Peças, preços e alerta de estoque baixo", "todos"],
  ["/painel/financeiro/receber", "Contas a receber", "OS com saldo em aberto e cobrança pelo WhatsApp", "gestao"],
  ["/painel/relatorios", "Relatórios", "Exportar OS, pagamentos e estoque em CSV", "gestao"],
  ["/painel/financeiro", "Financeiro", "Receita, margem, ticket médio e desempenho", "dono"],
  ["/painel/auditoria", "Auditoria", "Quem mudou o quê e quando", "dono"],
];

export default async function Mais() {
  const supabase = await createClient();
  const [{ count }, papel] = await Promise.all([
    supabase.from("pedidos_site").select("id", { count: "exact", head: true }).eq("status", "novo"),
    papelAtual(supabase),
  ]);
  const visiveis = ITENS.filter(([, , , q]) => q === "todos" || (q === "gestao" && ehGestao(papel)) || (q === "dono" && papel === "dono"));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Mais</h1>
      <ul className="mt-4 space-y-3">
        {visiveis.map(([h, t, d]) => (
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
      <div className="mt-6">
        <NotificacoesToggle chavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      </div>
    </div>
  );
}
