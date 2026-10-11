import { createClient } from "@/lib/supabase/server";
import { salvarResponsavel } from "@/app/painel/actions";
import { diaBR } from "@/lib/painel";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnGhost, card } from "./ui";

export async function ResponsavelOS({ osId, mecanicoId, garantia, entregueEm }: {
  osId: string; mecanicoId: string | null; garantia: number; entregueEm: string | null;
}) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("equipe_ativa");
  const equipe = (data ?? []) as { user_id: string; nome: string; papel: string }[];

  let fim: string | null = null;
  if (entregueEm && garantia > 0) {
    const d = new Date(entregueEm);
    d.setDate(d.getDate() + garantia);
    fim = d.toLocaleDateString("sv-SE", { timeZone: "America/Bahia" });
  }

  return (
    <form action={salvarResponsavel} className={card}>
      <input type="hidden" name="osId" value={osId} />
      <h2 className="font-display text-3xl font-bold">Responsável e garantia</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="mec" className="mb-1 block text-sm font-semibold">Mecânico</label>
          <select id="mec" name="mecanicoId" defaultValue={mecanicoId ?? ""} className={input}>
            <option value="">Sem responsável</option>
            {equipe.map((e) => <option key={e.user_id} value={e.user_id}>{e.nome}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gar" className="mb-1 block text-sm font-semibold">Garantia (dias)</label>
          <input id="gar" name="garantia" inputMode="numeric" defaultValue={garantia} className={input} />
        </div>
      </div>
      {fim && <p className="mt-2 text-sm font-semibold text-wa">Garantia vale até {diaBR(fim)}.</p>}
      {!entregueEm && garantia > 0 && <p className="mt-2 text-sm text-mute">A contagem começa quando a OS for marcada como Entregue.</p>}
      <SubmitButton className={`${btnGhost} mt-3`}>Salvar</SubmitButton>
    </form>
  );
}
