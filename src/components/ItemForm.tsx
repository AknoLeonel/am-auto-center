"use client";
import { useActionState, useState } from "react";
import { addItem, type Estado } from "@/app/painel/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary } from "./ui";

export type PecaOpcao = { id: string; nome: string; qtd: number; preco: number };

// Troque a key do componente (ex.: quantidade de itens) para limpar o formulário após adicionar.
export function ItemForm({ osId, pecas }: { osId: string; pecas: PecaOpcao[] }) {
  const [estado, action] = useActionState<Estado, FormData>(addItem, {});
  const [pecaId, setPecaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("servico");

  function escolher(id: string) {
    setPecaId(id);
    const p = pecas.find((x) => x.id === id);
    if (p) { setDescricao(p.nome); setValor(String(p.preco).replace(".", ",")); setTipo("peca"); }
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="osId" value={osId} />
      {pecas.length > 0 && (
        <>
          <label htmlFor="peca" className="mb-1 block text-sm font-semibold">Peça do estoque (opcional)</label>
          <select id="peca" name="pecaId" value={pecaId} onChange={(e) => escolher(e.target.value)} className={`${input} mb-2`}>
            <option value="">Item avulso (sem baixa de estoque)</option>
            {pecas.map((p) => <option key={p.id} value={p.id}>{p.nome} · {p.qtd} em estoque</option>)}
          </select>
        </>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[7rem_1fr_5rem_7rem_auto]">
        <select name="tipo" aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={!!pecaId} className={input}>
          <option value="servico">Serviço</option><option value="peca">Peça</option>
        </select>
        {pecaId && <input type="hidden" name="tipo" value="peca" />}
        <input name="descricao" required aria-label="Descrição" placeholder="Descrição" autoComplete="off"
          value={descricao} onChange={(e) => setDescricao(e.target.value)} className={`${input} col-span-2 sm:col-span-1`} />
        <input name="qtd" aria-label="Quantidade" inputMode="decimal" placeholder="Qtd" defaultValue="1" className={input} />
        <input name="valor" aria-label="Valor unitário" inputMode="decimal" placeholder="Valor R$"
          value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        <SubmitButton pendente="..." className={`${btnPrimary} col-span-2 sm:col-span-1`}>Adicionar</SubmitButton>
      </div>
      {estado.erro && <p role="alert" className="mt-2 text-sm text-red-700">{estado.erro}</p>}
    </form>
  );
}
