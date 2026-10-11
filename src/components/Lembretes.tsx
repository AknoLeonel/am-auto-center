import { createClient } from "@/lib/supabase/server";
import { diaBR } from "@/lib/painel";
import { criarLembrete, removerLembrete } from "@/app/painel/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary, card } from "./ui";

const MOTIVOS = ["Troca de óleo", "Revisão dos freios", "Teste de bateria", "Alinhamento e balanceamento", "Revisão geral"];
const PRAZOS: [number, string][] = [[1, "1 mês"], [3, "3 meses"], [5, "5 meses"], [6, "6 meses"], [12, "1 ano"]];

export async function Lembretes({ osId }: { osId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.from("lembretes").select("id,motivo,data_aviso,enviado").eq("os_id", osId).order("data_aviso");
  const lista = data ?? [];

  return (
    <section className={card}>
      <h2 className="font-display text-3xl font-bold">Lembrar o cliente de voltar</h2>
      <p className="text-sm text-mute">Na data marcada, o cliente aparece na tela Retornos com a mensagem pronta.</p>

      <form action={criarLembrete} className="mt-3">
        <input type="hidden" name="osId" value={osId} />
        <label htmlFor="motivo" className="mb-1 block text-sm font-semibold">Motivo</label>
        <select id="motivo" name="motivo" className={input}>{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</select>

        <fieldset className="mt-3">
          <legend className="mb-1 text-sm font-semibold">Avisar em</legend>
          <div className="flex flex-wrap gap-2">
            {PRAZOS.map(([m, l]) => (
              <label key={m}>
                <input type="radio" name="meses" value={m} defaultChecked={m === 5} className="peer sr-only" />
                <span className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-2 border-line bg-white px-4 text-sm font-semibold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-signal">{l}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <SubmitButton className={`${btnPrimary} mt-4 w-full`}>Agendar lembrete</SubmitButton>
      </form>

      {lista.length > 0 && (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {lista.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{l.motivo}</span>
                <span className="block text-sm text-mute">{l.enviado ? "Já avisado" : `Avisar em ${diaBR(l.data_aviso)}`}</span>
              </span>
              <form action={removerLembrete}>
                <input type="hidden" name="osId" value={osId} />
                <input type="hidden" name="id" value={l.id} />
                <button aria-label={`Remover lembrete ${l.motivo}`} className="h-11 w-11 text-xl text-red-700">×</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
