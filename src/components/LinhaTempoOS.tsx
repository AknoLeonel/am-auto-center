import { createClient } from "@/lib/supabase/server";
import { statusLabel, TZ } from "@/lib/painel";
import { card } from "./ui";

const duracao = (ms: number) => {
  const min = Math.round(ms / 60000);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h ${min % 60 ? `${min % 60} min` : ""}`.trim();
  return `${Math.round(h / 24)} dias`;
};

export async function LinhaTempoOS({ osId }: { osId: string }) {
  const supabase = await createClient();
  const [h, eq] = await Promise.all([
    supabase.from("os_status_hist").select("id,para,por,em").eq("os_id", osId).order("em").order("id"),
    supabase.rpc("equipe_ativa"),
  ]);
  const lista = h.data ?? [];
  if (lista.length === 0) return null;
  const nome = (id: string | null) => (eq.data as { user_id: string; nome: string }[] | null)?.find((e) => e.user_id === id)?.nome;

  return (
    <details className={card}>
      <summary className="min-h-11 cursor-pointer py-1 font-display text-3xl font-bold">Linha do tempo</summary>
      <ol className="mt-2 border-l-2 border-line pl-4">
        {lista.map((x, i) => {
          const prox = lista[i + 1];
          const ms = (prox ? new Date(prox.em) : new Date()).getTime() - new Date(x.em).getTime();
          return (
            <li key={x.id} className="relative pb-3">
              <span aria-hidden className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-brand" />
              <p className="font-semibold">{statusLabel(x.para)}</p>
              <p className="text-sm text-mute">
                {new Date(x.em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ })}
                {nome(x.por) ? ` · ${nome(x.por)}` : ""}
                {` · ${prox ? "ficou" : "há"} ${duracao(ms)}${prox ? "" : " nesta etapa"}`}
              </p>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
