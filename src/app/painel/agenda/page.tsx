import { createClient } from "@/lib/supabase/server";
import { waTo } from "@/lib/painel";
import { mudarAgendamento } from "./actions";
import { AgendaForm } from "@/components/AgendaForm";
import { btnWa, btnGhost, card } from "@/components/ui";

const TZ = "America/Bahia";
type A = {
  id: string; inicio: string; descricao: string; nome: string | null; telefone: string | null;
  placa: string | null; mecanico_id: string | null; status: string;
};

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: TZ });
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

export default async function Agenda() {
  const supabase = await createClient();
  // Mostra desde o início do dia de hoje (horário da Bahia, UTC-3).
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const desde = new Date(`${hoje}T00:00:00-03:00`).toISOString();

  const [ag, eq] = await Promise.all([
    supabase.from("agendamentos").select("id,inicio,descricao,nome,telefone,placa,mecanico_id,status")
      .gte("inicio", desde).neq("status", "cancelado").order("inicio").limit(200),
    supabase.rpc("equipe_ativa"),
  ]);
  const lista = (ag.data ?? []) as A[];
  const equipe = (eq.data ?? []) as { user_id: string; nome: string }[];
  const nomeMec = (id: string | null) => equipe.find((e) => e.user_id === id)?.nome;

  const grupos = new Map<string, A[]>();
  for (const a of lista) {
    const k = dia(a.inicio);
    grupos.set(k, [...(grupos.get(k) ?? []), a]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Agenda</h1>

      <details className={`${card} mt-4`}>
        <summary className="flex min-h-11 cursor-pointer items-center font-display text-2xl font-bold">+ Novo agendamento</summary>
        <AgendaForm equipe={equipe} />
      </details>

      {lista.length === 0 ? <p className="mt-6 text-mute">Nenhum agendamento a partir de hoje.</p> : (
        [...grupos].map(([d, itens]) => (
          <section key={d} className="mt-6">
            <h2 className="font-display text-3xl font-bold capitalize">{d}</h2>
            <ul className="mt-2 space-y-3">
              {itens.map((a) => {
                const msg = `Olá${a.nome ? ", " + a.nome.split(" ")[0] : ""}! Confirmando seu horário na AM Auto Center: ${dia(a.inicio)} às ${hora(a.inicio)} (${a.descricao}). Está tudo certo?`;
                return (
                  <li key={a.id} className={`${card} ${a.status === "concluido" ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl font-bold leading-tight">{a.descricao}</p>
                        <p className="font-semibold">{[a.nome, a.placa].filter(Boolean).join(" · ") || "Sem cliente informado"}</p>
                        {nomeMec(a.mecanico_id) && <p className="text-sm text-mute">Mecânico: {nomeMec(a.mecanico_id)}</p>}
                      </div>
                      <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-sm font-bold text-white">{hora(a.inicio)}</span>
                    </div>
                    <form action={mudarAgendamento} className="mt-3 grid gap-2 sm:grid-cols-3">
                      <input type="hidden" name="id" value={a.id} />
                      {a.telefone && <a href={waTo(a.telefone, msg)} target="_blank" rel="noopener" className={btnWa}>Confirmar</a>}
                      {a.status === "marcado" && <button name="status" value="concluido" className={btnGhost}>Concluído</button>}
                      <button name="status" value="cancelado" className={btnGhost}>Cancelar</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
