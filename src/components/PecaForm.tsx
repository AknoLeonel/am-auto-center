"use client";
import { useActionState } from "react";
import Link from "next/link";
import { salvarPeca, type PecaEstado } from "@/app/painel/estoque/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary, btnGhost } from "./ui";

export type Peca = { id: string; nome: string; codigo: string | null; qtd: number; minimo: number; custo: number; preco: number };

const lbl = "mb-1 mt-3 block text-sm font-semibold";
const fmt = (n: number) => String(n).replace(".", ",");

export function PecaForm({ peca }: { peca?: Peca }) {
  const [estado, action] = useActionState<PecaEstado, FormData>(salvarPeca, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={peca?.id ?? ""} />
      <label htmlFor="nome" className={lbl}>Nome da peça</label>
      <input id="nome" name="nome" required defaultValue={peca?.nome} placeholder="Ex.: Pastilha de freio dianteira" className={input} />
      <label htmlFor="codigo" className={lbl}>Código (opcional)</label>
      <input id="codigo" name="codigo" defaultValue={peca?.codigo ?? ""} className={input} />
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="qtd" className={lbl}>Em estoque</label>
          <input id="qtd" name="qtd" inputMode="decimal" defaultValue={fmt(peca?.qtd ?? 0)} className={input} /></div>
        <div><label htmlFor="minimo" className={lbl}>Estoque mínimo</label>
          <input id="minimo" name="minimo" inputMode="decimal" defaultValue={fmt(peca?.minimo ?? 0)} className={input} /></div>
        <div><label htmlFor="custo" className={lbl}>Custo (R$)</label>
          <input id="custo" name="custo" inputMode="decimal" defaultValue={fmt(peca?.custo ?? 0)} className={input} /></div>
        <div><label htmlFor="preco" className={lbl}>Preço de venda (R$)</label>
          <input id="preco" name="preco" inputMode="decimal" defaultValue={fmt(peca?.preco ?? 0)} className={input} /></div>
      </div>
      {estado.erro && <p role="alert" className="mt-3 text-sm text-red-700">{estado.erro}</p>}
      <div className="mt-5 flex gap-2">
        <SubmitButton className={`${btnPrimary} flex-1`}>{peca ? "Salvar alterações" : "Cadastrar peça"}</SubmitButton>
        <Link href="/painel/estoque" className={btnGhost}>Cancelar</Link>
      </div>
    </form>
  );
}
