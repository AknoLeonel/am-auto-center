import { createClient } from "@/lib/supabase/server";
import { brl, TZ } from "@/lib/painel";
import { papelAtual } from "@/lib/papel";
import { estornarPagamento } from "@/app/painel/financeiro/actions";
import { PagamentoForm } from "./PagamentoForm";
import { card } from "./ui";

const FORMA: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", debito: "Débito", credito: "Crédito", transferencia: "Transferência" };

// Só para dono e atendente: o mecânico não vê valores recebidos.
export async function PagamentosOS({ osId, total }: { osId: string; total: number }) {
  const supabase = await createClient();
  const papel = await papelAtual(supabase);
  if (papel !== "dono" && papel !== "atendente") return null;

  const { data } = await supabase.from("pagamentos").select("id,valor,forma,pago_em,obs").eq("os_id", osId).order("pago_em");
  const lista = data ?? [];
  const pago = lista.reduce((s, p) => s + Number(p.valor), 0);
  const saldo = Math.round((total - pago) * 100) / 100;

  return (
    <section className={card}>
      <h2 className="font-display text-3xl font-bold">Pagamentos</h2>
      <p className="mt-1 flex flex-wrap gap-x-4 text-sm">
        <span>Total <strong>{brl(total)}</strong></span>
        <span>Recebido <strong>{brl(pago)}</strong></span>
        <span className={saldo > 0 ? "font-bold text-red-700" : "font-bold text-wa"}>
          {saldo > 0 ? `Falta receber ${brl(saldo)}` : saldo < 0 ? `Recebido a mais ${brl(-saldo)}` : "Quitado"}
        </span>
      </p>

      {lista.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {lista.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{brl(Number(p.valor))}</span> · {FORMA[p.forma] ?? p.forma}
                <span className="block text-sm text-mute">
                  {new Date(p.pago_em).toLocaleDateString("pt-BR", { timeZone: TZ })}{p.obs ? ` · ${p.obs}` : ""}
                </span>
              </span>
              {papel === "dono" && (
                <form action={estornarPagamento}>
                  <input type="hidden" name="osId" value={osId} />
                  <input type="hidden" name="id" value={p.id} />
                  <button aria-label="Estornar pagamento" className="h-11 w-11 text-xl text-red-700">×</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <PagamentoForm key={lista.length} osId={osId} saldo={saldo} />
    </section>
  );
}
