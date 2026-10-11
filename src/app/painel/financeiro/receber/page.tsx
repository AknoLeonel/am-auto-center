import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brl, TZ, waTo, statusLabel, diasDesde } from "@/lib/painel";
import { papelAtual, ehGestao } from "@/lib/papel";
import { btnWa, btnGhost, card } from "@/components/ui";

type Conta = {
  id: string; numero: number; status: string; placa: string; modelo: string | null; cliente_nome: string; cliente_telefone: string | null;
  total: number; pago: number; saldo: number; entregue_em: string | null; criado_em: string;
};

export default async function Receber() {
  const supabase = await createClient();
  if (!ehGestao(await papelAtual(supabase))) {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para dono e atendente.</p>;
  }

  const { data } = await supabase.from("os_financeiro")
    .select("id,numero,status,placa,modelo,cliente_nome,cliente_telefone,total,pago,saldo,entregue_em,criado_em")
    .in("status", ["pronto", "entregue"]).gt("saldo", 0).order("entregue_em", { ascending: true, nullsFirst: false }).limit(200);
  const contas = ((data ?? []) as Conta[]).map((c) => ({ ...c, total: Number(c.total), pago: Number(c.pago), saldo: Number(c.saldo) }));
  const totalAberto = contas.reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Contas a receber</h1>
      <p className="text-mute">{contas.length} {contas.length === 1 ? "ordem" : "ordens"} com saldo · {brl(totalAberto)} em aberto</p>

      {contas.length === 0 ? <p className="mt-6 text-mute">Tudo recebido. Nenhuma OS pronta ou entregue com saldo.</p> : (
        <ul className="mt-4 space-y-3">
          {contas.map((c) => {
            const dias = c.entregue_em ? diasDesde(c.entregue_em) : null;
            const msg = `Olá, ${c.cliente_nome.split(" ")[0]}! Aqui é da AM Auto Center. Consta um saldo de ${brl(c.saldo)} referente ao serviço do seu ${c.modelo || "veículo"} (placa ${c.placa}). Podemos combinar o pagamento? Pix e cartão aceitos.`;
            return (
              <li key={c.id} className={`${card} ${dias != null && dias > 30 ? "border-l-[6px] border-l-red-600" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold leading-tight">{c.cliente_nome}</p>
                    <p className="text-sm text-mute">{c.placa} · OS {c.numero} · {statusLabel(c.status)}</p>
                    <p className="text-sm text-mute">
                      {c.entregue_em ? `Entregue em ${new Date(c.entregue_em).toLocaleDateString("pt-BR", { timeZone: TZ })} (${dias} ${dias === 1 ? "dia" : "dias"})` : "Ainda não entregue"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold leading-none text-red-700 tabular-nums">{brl(c.saldo)}</p>
                    <p className="text-xs text-mute">de {brl(c.total)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <a href={waTo(c.cliente_telefone, msg)} target="_blank" rel="noopener" className={btnWa}>Cobrar no WhatsApp</a>
                  <Link href={`/painel/os/${c.id}`} className={btnGhost}>Registrar pagamento</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
