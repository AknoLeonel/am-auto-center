"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATUS, statusLabel, brl, dataBR, num, waTo } from "@/lib/painel";
import { input, btnPrimary, btnWa, card } from "@/components/ui";
import { LembreteForm } from "@/components/LembreteForm";

type Item = { id: string; tipo: "servico" | "peca"; descricao: string; qtd: number; valor_unit: number };
type OS = {
  id: string; numero: number; status: string; defeito: string | null; km: number | null;
  observacoes: string | null; criado_em: string;
  clientes: { nome: string; telefone: string | null };
  veiculos: { id: string; placa: string; modelo: string | null; ano: number | null };
};
type Hist = { id: string; numero: number; status: string; defeito: string | null; criado_em: string };

export default function DetalheOS() {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OS | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [hist, setHist] = useState<Hist[]>([]);
  const [obs, setObs] = useState("");
  const [novo, setNovo] = useState({ tipo: "servico", descricao: "", qtd: "1", valor: "" });
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const o = await supabase.from("ordens_servico")
      .select("id,numero,status,defeito,km,observacoes,criado_em,clientes(nome,telefone),veiculos(id,placa,modelo,ano)")
      .eq("id", id).single();
    if (o.error) { setErr("Ordem não encontrada."); return; }
    const row = o.data as unknown as OS;
    setOs(row); setObs(row.observacoes ?? "");
    const it = await supabase.from("os_itens").select("id,tipo,descricao,qtd,valor_unit").eq("os_id", id);
    setItens(((it.data ?? []) as Item[]).map((x) => ({ ...x, qtd: Number(x.qtd), valor_unit: Number(x.valor_unit) })));
    const h = await supabase.from("ordens_servico").select("id,numero,status,defeito,criado_em")
      .eq("veiculo_id", row.veiculos.id).neq("id", id).order("criado_em", { ascending: false }).limit(10);
    setHist((h.data ?? []) as Hist[]);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <p className="text-red-700">{err}</p>;
  if (!os) return <p className="text-mute">Carregando...</p>;

  const total = itens.reduce((s, i) => s + i.qtd * i.valor_unit, 0);
  const veic = `${os.veiculos.modelo || "veículo"}${os.veiculos.ano ? " " + os.veiculos.ano : ""}`;
  const nome1 = os.clientes.nome.split(" ")[0];

  async function mudarStatus(s: string) {
    await supabase.from("ordens_servico").update({
      status: s, concluido_em: s === "pronto" || s === "entregue" ? new Date().toISOString() : null,
    }).eq("id", id);
    load();
  }
  async function salvarObs() {
    if (obs !== (os?.observacoes ?? "")) await supabase.from("ordens_servico").update({ observacoes: obs || null }).eq("id", id);
  }
  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.descricao.trim()) return;
    await supabase.from("os_itens").insert({
      os_id: id, tipo: novo.tipo, descricao: novo.descricao.trim(), qtd: num(novo.qtd) || 1, valor_unit: num(novo.valor),
    });
    setNovo({ ...novo, descricao: "", qtd: "1", valor: "" });
    load();
  }
  async function delItem(itemId: string) {
    await supabase.from("os_itens").delete().eq("id", itemId);
    load();
  }

  const msgOrcamento =
    `Olá, ${nome1}! Segue o orçamento do seu ${veic} (placa ${os.veiculos.placa}) na AM Auto Center:\n\n` +
    itens.map((i) => `• ${i.descricao} (${i.qtd}x): ${brl(i.qtd * i.valor_unit)}`).join("\n") +
    `\n\nTotal: ${brl(total)}\n\nPodemos seguir com o serviço?`;
  const msgPronto =
    `Olá, ${nome1}! Seu ${veic} (placa ${os.veiculos.placa}) está pronto para retirada na AM Auto Center.` +
    (total > 0 ? ` Valor total: ${brl(total)}.` : "") + " Aguardamos você!";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/painel" className="text-sm font-semibold text-brand">← Voltar às ordens</Link>

      <section className={card}>
        <p className="text-sm text-mute">OS {os.numero} · aberta em {dataBR(os.criado_em)}</p>
        <h1 className="font-display text-5xl font-bold leading-none">{os.veiculos.placa}</h1>
        <p className="mt-1 font-semibold">{veic}{os.km ? ` · ${os.km.toLocaleString("pt-BR")} km` : ""}</p>
        <p className="text-mute">{os.clientes.nome}{os.clientes.telefone ? ` · ${os.clientes.telefone}` : ""}</p>
        {os.defeito && <p className="mt-3 rounded-md bg-paper p-3 text-sm"><strong>Defeito relatado:</strong> {os.defeito}</p>}
        <label htmlFor="status" className="mb-1 mt-4 block text-sm font-semibold">Situação</label>
        <select id="status" className={input} value={os.status} onChange={(e) => mudarStatus(e.target.value)}>
          {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </section>

      <section className={card}>
        <h2 className="font-display text-3xl font-bold">Serviços e peças</h2>
        {itens.length === 0 ? <p className="mt-2 text-mute">Nada lançado ainda.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {itens.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-semibold">{i.descricao}</p>
                  <p className="text-sm text-mute">{i.tipo === "peca" ? "Peça" : "Serviço"} · {i.qtd}x {brl(i.valor_unit)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{brl(i.qtd * i.valor_unit)}</span>
                  <button type="button" onClick={() => delItem(i.id)} aria-label={`Remover ${i.descricao}`} className="h-10 w-10 text-xl text-red-700">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex justify-between border-t border-line pt-3 font-display text-3xl font-bold">
          <span>Total</span><span>{brl(total)}</span>
        </p>

        <form onSubmit={addItem} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-[7rem_1fr_5rem_7rem_auto]">
          <select aria-label="Tipo" className={input} value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
            <option value="servico">Serviço</option><option value="peca">Peça</option>
          </select>
          <input aria-label="Descrição" placeholder="Descrição" className={`${input} col-span-2 sm:col-span-1`} value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
          <input aria-label="Quantidade" inputMode="decimal" placeholder="Qtd" className={input} value={novo.qtd} onChange={(e) => setNovo({ ...novo, qtd: e.target.value })} />
          <input aria-label="Valor unitário" inputMode="decimal" placeholder="Valor R$" className={input} value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} />
          <button className={`${btnPrimary} col-span-2 sm:col-span-1`}>Adicionar</button>
        </form>
      </section>

      <section className={card}>
        <label htmlFor="obs" className="font-display text-3xl font-bold">Observações internas</label>
        <textarea id="obs" rows={3} className={`${input} mt-2`} value={obs} onChange={(e) => setObs(e.target.value)} onBlur={salvarObs} />
      </section>

      <LembreteForm osId={id} />

      <section className="grid gap-2 sm:grid-cols-2">
        <a href={waTo(os.clientes.telefone, msgOrcamento)} target="_blank" rel="noopener" className={btnWa}>Enviar orçamento no WhatsApp</a>
        <a href={waTo(os.clientes.telefone, msgPronto)} target="_blank" rel="noopener" className={btnWa}>Avisar: carro pronto</a>
<Link href={`/painel/os/${id}/imprimir`} className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-line bg-white px-5 font-bold hover:border-ink sm:col-span-2">Imprimir ou salvar PDF</Link>
        {!os.clientes.telefone && <p className="text-sm text-mute sm:col-span-2">Sem telefone cadastrado: o WhatsApp abrirá sem destinatário.</p>}
      </section>

      <section className={card}>
        <h2 className="font-display text-3xl font-bold">Histórico deste veículo</h2>
        {hist.length === 0 ? <p className="mt-2 text-mute">Primeira passagem pela oficina.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {hist.map((h) => (
              <li key={h.id}>
                <Link href={`/painel/os/${h.id}`} className="flex justify-between gap-3 py-2 hover:text-brand">
                  <span>{dataBR(h.criado_em)} · {h.defeito || `OS ${h.numero}`}</span>
                  <span className="shrink-0 text-sm text-mute">{statusLabel(h.status)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
