import { createClient } from "@/lib/supabase/server";
import { CHECKLIST, type Momento } from "@/lib/checklist";
import { salvarChecklist } from "@/app/painel/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { btnGhost, card } from "./ui";

export async function ChecklistOS({ osId }: { osId: string }) {
  const supabase = await createClient();
  const { data } = await supabase.from("os_checklist").select("momento,item").eq("os_id", osId);
  const marcados = new Set((data ?? []).map((r) => `${r.momento}|${r.item}`));

  return (
    <>
      {(Object.keys(CHECKLIST) as Momento[]).map((m) => {
        const feitos = CHECKLIST[m].itens.filter((i) => marcados.has(`${m}|${i}`)).length;
        return (
          <details key={m} className={card}>
            <summary className="flex min-h-11 cursor-pointer items-center justify-between font-display text-3xl font-bold">
              {CHECKLIST[m].titulo}
              <span className="text-base font-semibold text-mute">{feitos}/{CHECKLIST[m].itens.length}</span>
            </summary>
            <form action={salvarChecklist} className="mt-2">
              <input type="hidden" name="osId" value={osId} />
              <input type="hidden" name="momento" value={m} />
              <ul>
                {CHECKLIST[m].itens.map((i) => (
                  <li key={i}>
                    <label className="flex min-h-12 items-center gap-3">
                      <input type="checkbox" name="item" value={i} defaultChecked={marcados.has(`${m}|${i}`)} className="h-6 w-6 accent-[var(--color-brand)]" />
                      <span>{i}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <SubmitButton className={`${btnGhost} mt-2 w-full`}>Salvar checklist</SubmitButton>
            </form>
          </details>
        );
      })}
    </>
  );
}
