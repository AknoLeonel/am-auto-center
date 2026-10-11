import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { statusLabel, brl, dataBR, waTo } from "@/lib/painel";
import { delItem, removerFoto } from "../../actions";
import { ItemForm } from "@/components/ItemForm";
import { FotoUploader } from "@/components/FotoUploader";
import { Lembretes } from "@/components/Lembretes";
import { OrcamentoOS } from "@/components/OrcamentoOS";
import { ChecklistOS } from "@/components/ChecklistOS";
import { ResponsavelOS } from "@/components/ResponsavelOS";
import { PagamentosOS } from "@/components/PagamentosOS";
import { LinhaTempoOS } from "@/components/LinhaTempoOS";
import { StatusOS } from "@/components/StatusOS";
import { ObsOS } from "@/components/ObsOS";
import { PendentesOS } from "@/components/PendentesOS";
import { btnWa, btnGhost, card } from "@/components/ui";

type Item = { id: string; tipo: "servico" | "peca"; descricao: string; qtd: number; valor_unit: number };
type OS = {
  id: string; numero: number; status: string; defeito: string | null; km: number | null;
  observacoes: string | null; criado_em: string;
  token_publico: string; mecanico_id: string | null; garantia_dias: number; entregue_em: string | null;
  clientes: { nome: string; telefone: string | null };
  veiculos: { id: string; placa: string; modelo: string | null; ano: number | null };
};

export default async function DetalheOS({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const o = await supabase.from("ordens_servico")
    .select("id,numero,status,defeito,km,observacoes,criado_em,token_publico,mecanico_id,garantia_dias,entregue_em,clientes(nome,telefone),veiculos(id,placa,modelo,ano)")
    .eq("id", id).maybeSingle();
  if (!o.data) notFound();
  const os = o.data as unknown as OS;

  const [it, h, fo, pe] = await Promise.all([
    supabase.from("os_itens").select("id,tipo,descricao,qtd,valor_unit").eq("os_id", id).order("id"),
    supabase.from("ordens_servico").select("id,numero,status,defeito,criado_em")
      .eq("veiculo_id", os.veiculos.id).neq("id", id).order("criado_em", { ascending: false }).limit(10),
    supabase.from("os_fotos").select("id,caminho").eq("os_id", id).order("criado_em"),
    supabase.from("pecas_estoque").select("id,nome,qtd,preco").eq("ativo", true).gt("qtd", 0).order("nome").limit(300),
  ]);
  const pecas = (pe.data ?? []).map((p) => ({ id: p.id, nome: p.nome, qtd: Number(p.qtd), preco: Number(p.preco) }));
  const itens = ((it.data ?? []) as Item[]).map((x) => ({ ...x, qtd: Number(x.qtd), valor_unit: Number(x.valor_unit) }));
  const hist = h.data ?? [];
  const fotos = fo.data ?? [];
  const urls = fotos.length
    ? (await supabase.storage.from("os-fotos").createSignedUrls(fotos.map((f) => f.caminho), 3600)).data ?? []
    : [];
  const urlDe = (caminho: string) => urls.find((u) => u.path === caminho)?.signedUrl ?? undefined;

  const total = itens.reduce((s, i) => s + i.qtd * i.valor_unit, 0);
  const veic = `${os.veiculos.modelo || "veículo"}${os.veiculos.ano ? " " + os.veiculos.ano : ""}`;
  const nome1 = os.clientes.nome.split(" ")[0];

  const msgOrcamento =
    `Olá, ${nome1}! Segue o orçamento do seu ${veic} (placa ${os.veiculos.placa}) na AM Auto Center:\n\n` +
    itens.map((i) => `• ${i.descricao} (${i.qtd}x): ${brl(i.qtd * i.valor_unit)}`).join("\n") +
    `\n\nTotal: ${brl(total)}\n\nPodemos seguir com o serviço?`;
  const msgPronto =
    `Olá, ${nome1}! Seu ${veic} (placa ${os.veiculos.placa}) está pronto para retirada na AM Auto Center.` +
    (total > 0 ? ` Valor total: ${brl(total)}.` : "") + " Aguardamos você!";

  const msgAcompanhar =
    `Olá, ${nome1}! Acompanhe o andamento do seu ${veic} (placa ${os.veiculos.placa}) na AM Auto Center, em tempo real: ` +
    `${site.url}/acompanhar/${os.token_publico}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/painel" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">← Voltar às ordens</Link>

      <PendentesOS osId={os.id} />

      <section className={card}>
        <p className="text-sm text-mute">OS {os.numero} · aberta em {dataBR(os.criado_em)}</p>
        <h1 className="font-display text-5xl font-bold leading-none">{os.veiculos.placa}</h1>
        <p className="mt-1 font-semibold">{veic}{os.km ? ` · ${os.km.toLocaleString("pt-BR")} km` : ""}</p>
        <p className="text-mute">{os.clientes.nome}{os.clientes.telefone ? ` · ${os.clientes.telefone}` : ""}</p>
        {os.defeito && <p className="mt-3 rounded-md bg-paper p-3 text-sm"><strong>Defeito relatado:</strong> {os.defeito}</p>}

        <StatusOS osId={os.id} status={os.status} />
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
                  <form action={delItem}>
                    <input type="hidden" name="osId" value={os.id} />
                    <input type="hidden" name="itemId" value={i.id} />
                    <button aria-label={`Remover ${i.descricao}`} className="h-11 w-11 text-xl text-red-700">×</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 flex justify-between border-t border-line pt-3 font-display text-3xl font-bold">
          <span>Total</span><span>{brl(total)}</span>
        </p>
        <ItemForm osId={os.id} pecas={pecas} />
      </section>

      <section className={card}>
        <h2 className="font-display text-3xl font-bold">Fotos</h2>
        {fotos.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <li key={f.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlDe(f.caminho)} alt="Foto da ordem de serviço" loading="lazy" className="aspect-square w-full rounded-md object-cover" />
                <form action={removerFoto} className="absolute right-1 top-1">
                  <input type="hidden" name="osId" value={os.id} />
                  <input type="hidden" name="id" value={f.id} />
                  <button aria-label="Remover foto" className="h-9 w-9 rounded-full bg-black/60 text-lg text-white">×</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <FotoUploader osId={os.id} />
      </section>

      <ObsOS osId={os.id} inicial={os.observacoes ?? ""} />

      <PagamentosOS osId={os.id} total={total} />

      <OrcamentoOS osId={os.id} nome={os.clientes.nome} telefone={os.clientes.telefone} veiculo={veic} qtdItens={itens.length} />

      <ChecklistOS osId={os.id} />

      <ResponsavelOS osId={os.id} mecanicoId={os.mecanico_id} garantia={os.garantia_dias} entregueEm={os.entregue_em} />

      <Lembretes osId={os.id} />

      <section className="grid gap-2 sm:grid-cols-2">
        <a href={waTo(os.clientes.telefone, msgOrcamento)} target="_blank" rel="noopener" className={btnWa}>Enviar orçamento no WhatsApp</a>
        <a href={waTo(os.clientes.telefone, msgAcompanhar)} target="_blank" rel="noopener" className={btnWa}>Enviar link de acompanhamento</a>
        <a href={waTo(os.clientes.telefone, msgPronto)} target="_blank" rel="noopener" className={btnWa}>Avisar: carro pronto</a>
        <Link href={`/painel/os/${id}/imprimir`} className={`${btnGhost} sm:col-span-2`}>Imprimir ou salvar PDF</Link>
        {!os.clientes.telefone && <p className="text-sm text-mute sm:col-span-2">Sem telefone cadastrado: o WhatsApp abrirá sem destinatário.</p>}
      </section>

      <LinhaTempoOS osId={os.id} />

      <section className={card}>
        <h2 className="font-display text-3xl font-bold">Histórico deste veículo</h2>
        {hist.length === 0 ? <p className="mt-2 text-mute">Primeira passagem pela oficina.</p> : (
          <ul className="mt-2 divide-y divide-line">
            {hist.map((x) => (
              <li key={x.id}>
                <Link href={`/painel/os/${x.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2 hover:text-brand">
                  <span>{dataBR(x.criado_em)} · {x.defeito || `OS ${x.numero}`}</span>
                  <span className="shrink-0 text-sm text-mute">{statusLabel(x.status)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
