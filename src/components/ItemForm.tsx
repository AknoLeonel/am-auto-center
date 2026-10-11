"use client";
import { useState } from "react";
import { itemSchema, primeiroErro } from "@/lib/validacao";
import { useEnviar } from "./useEnviar";
import { input, btnPrimary } from "./ui";

export type PecaOpcao = { id: string; nome: string; qtd: number; preco: number };

export function ItemForm({ osId, pecas }: { osId: string; pecas: PecaOpcao[] }) {
  const enviar = useEnviar();
  const [pecaId, setPecaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [qtd, setQtd] = useState("1");
  const [tipo, setTipo] = useState("servico");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function escolher(id: string) {
    setPecaId(id);
    const p = pecas.find((x) => x.id === id);
    if (p) { setDescricao(p.nome); setValor(String(p.preco).replace(".", ",")); setTipo("peca"); }
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const p = itemSchema.safeParse({ osId, pecaId, tipo: pecaId ? "peca" : tipo, descricao, qtd, valor });
    if (!p.success) { setErro(primeiroErro(p.error)); return; }
    setOcupado(true);
    const r = await enviar("item", {
      os_id: osId, tipo: p.data.tipo, descricao: p.data.descricao, qtd: p.data.qtd, valor: p.data.valor, peca_id: p.data.pecaId,
    }, undefined, "Item adicionado.");
    setOcupado(false);
    if (r.resultado === "erro") { setErro(r.erro ?? "Não foi possível adicionar."); return; }
    setPecaId(""); setDescricao(""); setValor(""); setQtd("1"); setTipo("servico");
  }

  return (
    <form onSubmit={adicionar} className="mt-4">
      {pecas.length > 0 && (
        <>
          <label htmlFor="peca" className="mb-1 block text-sm font-semibold">Peça do estoque (opcional)</label>
          <select id="peca" value={pecaId} onChange={(e) => escolher(e.target.value)} className={`${input} mb-2`}>
            <option value="">Item avulso (sem baixa de estoque)</option>
            {pecas.map((p) => <option key={p.id} value={p.id}>{p.nome} · {p.qtd} em estoque</option>)}
          </select>
        </>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[7rem_1fr_5rem_7rem_auto]">
        <select aria-label="Tipo" value={pecaId ? "peca" : tipo} onChange={(e) => setTipo(e.target.value)} disabled={!!pecaId} className={input}>
          <option value="servico">Serviço</option><option value="peca">Peça</option>
        </select>
        <input required aria-label="Descrição" placeholder="Descrição" autoComplete="off" value={descricao}
          onChange={(e) => setDescricao(e.target.value)} className={`${input} col-span-2 sm:col-span-1`} />
        <input aria-label="Quantidade" inputMode="decimal" placeholder="Qtd" value={qtd} onChange={(e) => setQtd(e.target.value)} className={input} />
        <input aria-label="Valor unitário" inputMode="decimal" placeholder="Valor R$" value={valor} onChange={(e) => setValor(e.target.value)} className={input} />
        <button disabled={ocupado} className={`${btnPrimary} col-span-2 sm:col-span-1`}>{ocupado ? "..." : "Adicionar"}</button>
      </div>
      {erro && <p role="alert" className="mt-2 text-sm text-red-700">{erro}</p>}
    </form>
  );
}
