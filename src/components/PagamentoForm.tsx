"use client";
import { useActionState } from "react";
import { registrarPagamento, type PagEstado } from "@/app/painel/financeiro/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary } from "./ui";

const FORMAS: [string, string][] = [["pix", "Pix"], ["dinheiro", "Dinheiro"], ["debito", "Débito"], ["credito", "Crédito"], ["transferencia", "Transferência"]];

// A key do componente muda a cada pagamento, o que limpa o formulário.
export function PagamentoForm({ osId, saldo, hoje }: { osId: string; saldo: number; hoje: string }) {
  const [estado, action] = useActionState<PagEstado, FormData>(registrarPagamento, {});
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="osId" value={osId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <input name="valor" aria-label="Valor recebido" inputMode="decimal" placeholder="Valor R$"
          defaultValue={saldo > 0 ? String(saldo).replace(".", ",") : ""} className={input} />
        <select name="forma" aria-label="Forma de pagamento" defaultValue="pix" className={input}>
          {FORMAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input name="data" type="date" aria-label="Data em que o cliente pagou" defaultValue={hoje} max={hoje} className={input} />
        <input name="obs" aria-label="Observação" placeholder="Obs. (opcional)" maxLength={200} className={input} />
        <SubmitButton pendente="..." className={`${btnPrimary} col-span-2 sm:col-span-1`}>Receber</SubmitButton>
      </div>
      {estado.erro && <p role="alert" className="mt-2 text-sm text-red-700">{estado.erro}</p>}
      {estado.excede && (
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="confirmo" value="1" className="h-5 w-5" />
          Confirmo o valor (adiantamento ou valor a mais)
        </label>
      )}
    </form>
  );
}
