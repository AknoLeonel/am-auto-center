"use client";
import { useActionState } from "react";
import { registrarPagamento, type PagEstado } from "@/app/painel/financeiro/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary } from "./ui";

const FORMAS: [string, string][] = [["pix", "Pix"], ["dinheiro", "Dinheiro"], ["debito", "Débito"], ["credito", "Crédito"], ["transferencia", "Transferência"]];

// A key do componente muda a cada pagamento, o que limpa o formulário.
export function PagamentoForm({ osId, saldo }: { osId: string; saldo: number }) {
  const [estado, action] = useActionState<PagEstado, FormData>(registrarPagamento, {});
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="osId" value={osId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <input name="valor" aria-label="Valor recebido" inputMode="decimal" placeholder="Valor R$"
          defaultValue={saldo > 0 ? String(saldo).replace(".", ",") : ""} className={input} />
        <select name="forma" aria-label="Forma de pagamento" defaultValue="pix" className={input}>
          {FORMAS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input name="obs" aria-label="Observação" placeholder="Obs. (opcional)" maxLength={200} className={`${input} col-span-2 sm:col-span-1`} />
        <SubmitButton pendente="..." className={`${btnPrimary} col-span-2 sm:col-span-1`}>Receber</SubmitButton>
      </div>
      {estado.erro && <p role="alert" className="mt-2 text-sm text-red-700">{estado.erro}</p>}
    </form>
  );
}
