"use client";
import { useActionState } from "react";
import { addItem, type Estado } from "@/app/painel/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary } from "./ui";

export function ItemForm({ osId }: { osId: string }) {
  const [estado, action] = useActionState<Estado, FormData>(addItem, {});
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="osId" value={osId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[7rem_1fr_5rem_7rem_auto]">
        <select name="tipo" aria-label="Tipo" className={input} defaultValue="servico">
          <option value="servico">Serviço</option><option value="peca">Peça</option>
        </select>
        <input name="descricao" required aria-label="Descrição" placeholder="Descrição" autoComplete="off" className={`${input} col-span-2 sm:col-span-1`} />
        <input name="qtd" aria-label="Quantidade" inputMode="decimal" placeholder="Qtd" defaultValue="1" className={input} />
        <input name="valor" aria-label="Valor unitário" inputMode="decimal" placeholder="Valor R$" className={input} />
        <SubmitButton pendente="..." className={`${btnPrimary} col-span-2 sm:col-span-1`}>Adicionar</SubmitButton>
      </div>
      {estado.erro && <p role="alert" className="mt-2 text-sm text-red-700">{estado.erro}</p>}
    </form>
  );
}
