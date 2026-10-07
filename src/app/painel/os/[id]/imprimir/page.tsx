"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { site } from "@/lib/site";
import { brl, dataBR } from "@/lib/painel";
import { btnPrimary } from "@/components/ui";

type Item = { id: string; tipo: string; descricao: string; qtd: number; valor_unit: number };
type OS = {
  numero: number; defeito: string | null; km: number | null; criado_em: string;
  clientes: { nome: string; telefone: string | null };
  veiculos: { placa: string; modelo: string | null; ano: number | null };
};

export default function Imprimir() {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OS | null>(null);
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const o = await supabase.from("ordens_servico")
        .select("numero,defeito,km,criado_em,clientes(nome,telefone),veiculos(placa,modelo,ano)").eq("id", id).single();
      if (!o.error) setOs(o.data as unknown as OS);
      const it = await supabase.from("os_itens").select("id,tipo,descricao,qtd,valor_unit").eq("os_id", id);
      setItens(((it.data ?? []) as Item[]).map((x) => ({ ...x, qtd: Number(x.qtd), valor_unit: Number(x.valor_unit) })));
    })();
  }, [id]);

  if (!os) return <p className="text-mute">Carregando...</p>;
  const total = itens.reduce((s, i) => s + i.qtd * i.valor_unit, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex gap-2">
        <button type="button" className={btnPrimary} onClick={() => window.print()}>Imprimir ou salvar PDF</button>
        <button type="button" className="min-h-12 px-3 font-semibold underline" onClick={() => window.history.back()}>Voltar</button>
      </div>

      <article className="border border-line bg-white p-6 text-black sm:p-8">
        <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-4" style={{ display: "flex" }}>
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-none">{site.name}</h1>
            <p className="mt-1 text-sm">{site.street}, {site.city} - {site.state}</p>
            <p className="text-sm">WhatsApp {site.phoneDisplay}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold leading-none">OS {os.numero}</p>
            <p className="text-sm">{dataBR(os.criado_em)}</p>
          </div>
        </header>

        <section className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-bold">Cliente</p>
            <p>{os.clientes.nome}</p>
            {os.clientes.telefone && <p>{os.clientes.telefone}</p>}
          </div>
          <div>
            <p className="font-bold">Veículo</p>
            <p>{os.veiculos.modelo || "Veículo"}{os.veiculos.ano ? ` ${os.veiculos.ano}` : ""} · Placa {os.veiculos.placa}</p>
            {os.km ? <p>{os.km.toLocaleString("pt-BR")} km</p> : null}
          </div>
        </section>

        {os.defeito && (
          <section className="mt-4 text-sm">
            <p className="font-bold">Defeito relatado</p>
            <p>{os.defeito}</p>
          </section>
        )}

        <table className="mt-5 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Descrição</th><th className="py-2">Qtd</th>
              <th className="py-2 text-right">Valor</th><th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-2">{i.descricao} <span className="text-xs text-mute">({i.tipo === "peca" ? "peça" : "serviço"})</span></td>
                <td className="py-2">{i.qtd}</td>
                <td className="py-2 text-right">{brl(i.valor_unit)}</td>
                <td className="py-2 text-right">{brl(i.qtd * i.valor_unit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="pt-3 text-right font-bold">Total</td><td className="pt-3 text-right font-display text-2xl font-bold">{brl(total)}</td></tr>
          </tfoot>
        </table>

        <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm">
          <div className="border-t border-black pt-1">Assinatura do cliente</div>
          <div className="border-t border-black pt-1">{site.name}</div>
        </div>
      </article>
    </div>
  );
}
