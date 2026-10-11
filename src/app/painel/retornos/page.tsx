import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { diaBR, hojeISO, waTo } from "@/lib/painel";
import { lembreteAdiar, lembreteAvisado } from "../actions";
import { btnWa, btnGhost, card } from "@/components/ui";

type R = {
  id: string; motivo: string; data_aviso: string;
  clientes: { nome: string; telefone: string | null } | null;
  veiculos: { placa: string; modelo: string | null } | null;
};

function Item({ r, urgente }: { r: R; urgente: boolean }) {
  const nome1 = (r.clientes?.nome ?? "").split(" ")[0];
  const veic = r.veiculos?.modelo || "veículo";
  const msg =
    `Olá, ${nome1}! Aqui é da AM Auto Center. Lembrete para o seu ${veic} (placa ${r.veiculos?.placa}): ${r.motivo.toLowerCase()}. ` +
    "Quer agendar um horário?";
  return (
    <li className={`${card} ${urgente ? "border-l-[6px] border-l-brand" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-bold leading-tight">{r.motivo}</p>
          <p className="font-semibold">{r.clientes?.nome} · {r.veiculos?.placa}</p>
          <p className="text-sm text-mute">{veic}{r.clientes?.telefone ? ` · ${r.clientes.telefone}` : ""}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${urgente ? "bg-brand text-white" : "bg-line"}`}>{diaBR(r.data_aviso)}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <a href={waTo(r.clientes?.telefone, msg)} target="_blank" rel="noopener" className={btnWa}>Avisar no WhatsApp</a>
        <form action={lembreteAvisado}><input type="hidden" name="id" value={r.id} /><button className={`${btnGhost} w-full`}>Marcar como avisado</button></form>
        <form action={lembreteAdiar}><input type="hidden" name="id" value={r.id} /><button className={`${btnGhost} w-full`}>Adiar 1 mês</button></form>
      </div>
    </li>
  );
}

export default async function Retornos() {
  const supabase = await createClient();
  const { data } = await supabase.from("lembretes")
    .select("id,motivo,data_aviso,clientes(nome,telefone),veiculos(placa,modelo)")
    .eq("enviado", false).order("data_aviso").limit(300);
  const rows = (data ?? []) as unknown as R[];

  const hoje = hojeISO();
  const agora = rows.filter((r) => r.data_aviso <= hoje);
  const depois = rows.filter((r) => r.data_aviso > hoje);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Retornos</h1>
      <p className="text-mute">Clientes que precisam voltar à oficina.</p>

      {rows.length === 0 ? (
        <p className="mt-6 text-mute">
          Nenhum retorno agendado. Abra uma <Link href="/painel" className="font-semibold text-brand underline">ordem de serviço</Link> e use
          &quot;Lembrar o cliente de voltar&quot;.
        </p>
      ) : (
        <>
          <h2 className="mt-6 font-display text-3xl font-bold">Avisar agora ({agora.length})</h2>
          {agora.length === 0 ? <p className="mt-2 text-mute">Ninguém para avisar hoje.</p> : (
            <ul className="mt-3 space-y-3">{agora.map((r) => <Item key={r.id} r={r} urgente />)}</ul>
          )}
          {depois.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-3xl font-bold">Próximos ({depois.length})</h2>
              <ul className="mt-3 space-y-3">{depois.map((r) => <Item key={r.id} r={r} urgente={false} />)}</ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
