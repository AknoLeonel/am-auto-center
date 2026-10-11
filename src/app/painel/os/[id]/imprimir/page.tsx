import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { brl, dataBR } from "@/lib/painel";
import { PrintButton } from "@/components/PrintButton";

type Item = { id: string; tipo: string; descricao: string; qtd: number; valor_unit: number };
type OS = {
  numero: number; defeito: string | null; km: number | null; criado_em: string; garantia_dias: number;
  clientes: { nome: string; telefone: string | null };
  veiculos: { placa: string; modelo: string | null; ano: number | null };
};

export default async function Imprimir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [o, it] = await Promise.all([
    supabase.from("ordens_servico")
      .select("numero,defeito,km,criado_em,garantia_dias,clientes(nome,telefone),veiculos(placa,modelo,ano)").eq("id", id).maybeSingle(),
    supabase.from("os_itens").select("id,tipo,descricao,qtd,valor_unit").eq("os_id", id).order("id"),
  ]);
  if (!o.data) notFound();
  const os = o.data as unknown as OS;
  const itens = ((it.data ?? []) as Item[]).map((x) => ({ ...x, qtd: Number(x.qtd), valor_unit: Number(x.valor_unit) }));
  const total = itens.reduce((s, i) => s + i.qtd * i.valor_unit, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <PrintButton />

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

        {os.garantia_dias > 0 && (
          <p className="mt-6 text-sm"><strong>Garantia do serviço:</strong> {os.garantia_dias} dias, contados a partir da entrega do veículo.</p>
        )}

        <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm">
          <div className="border-t border-black pt-1">Assinatura do cliente</div>
          <div className="border-t border-black pt-1">{site.name}</div>
        </div>
      </article>
    </div>
  );
}
