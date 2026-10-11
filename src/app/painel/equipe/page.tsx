import { createClient } from "@/lib/supabase/server";
import { papelAtual } from "@/lib/papel";
import { dataBR } from "@/lib/painel";
import { salvarMembro } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, btnPrimary, card } from "@/components/ui";

type P = { user_id: string; nome: string | null; papel: string; ativo: boolean; criado_em: string };

export default async function Equipe() {
  const supabase = await createClient();
  if ((await papelAtual(supabase)) !== "dono") {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para o dono da oficina.</p>;
  }
  const [{ data }, { data: claims }] = await Promise.all([
    supabase.from("perfis").select("user_id,nome,papel,ativo,criado_em").order("ativo").order("criado_em"),
    supabase.auth.getClaims(),
  ]);
  const lista = (data ?? []) as P[];
  const eu = claims?.claims?.sub;
  const pendentes = lista.filter((p) => !p.ativo).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Equipe</h1>
      <p className="text-mute">
        Quem entra no sistema fica <strong>aguardando liberação</strong> até você ativar aqui. Para criar um acesso novo, adicione o
        usuário no Supabase em Authentication &gt; Users.
      </p>
      {pendentes > 0 && <p role="status" className="mt-3 rounded-md border-l-[6px] border-l-amber-500 bg-white p-3 font-semibold">{pendentes} {pendentes === 1 ? "usuário aguarda" : "usuários aguardam"} liberação.</p>}

      <ul className="mt-4 space-y-3">
        {lista.map((p) => {
          const sou = p.user_id === eu;
          return (
            <li key={p.user_id} className={`${card} ${p.ativo ? "" : "border-l-[6px] border-l-amber-500"}`}>
              <form action={salvarMembro}>
                <input type="hidden" name="userId" value={p.user_id} />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-mute">Entrou em {dataBR(p.criado_em)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.ativo ? "bg-wa text-white" : "bg-amber-100 text-amber-900"}`}>
                    {sou ? "Você" : p.ativo ? "Ativo" : "Aguardando liberação"}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label htmlFor={`n-${p.user_id}`} className="mb-1 block text-sm font-semibold">Nome</label>
                    <input id={`n-${p.user_id}`} name="nome" defaultValue={p.nome ?? ""} maxLength={60} className={input} />
                  </div>
                  <div>
                    <label htmlFor={`p-${p.user_id}`} className="mb-1 block text-sm font-semibold">Papel</label>
                    <select id={`p-${p.user_id}`} name="papel" defaultValue={p.papel} disabled={sou} className={input}>
                      <option value="dono">Dono (tudo)</option>
                      <option value="atendente">Atendente (sem financeiro)</option>
                      <option value="mecanico">Mecânico (só ordens)</option>
                    </select>
                    {sou && <input type="hidden" name="papel" value={p.papel} />}
                  </div>
                  <div>
                    <label htmlFor={`a-${p.user_id}`} className="mb-1 block text-sm font-semibold">Acesso</label>
                    <select id={`a-${p.user_id}`} name="ativo" defaultValue={p.ativo ? "1" : "0"} disabled={sou} className={input}>
                      <option value="1">Liberado</option>
                      <option value="0">Bloqueado</option>
                    </select>
                    {sou && <input type="hidden" name="ativo" value="1" />}
                  </div>
                </div>
                {!sou && <SubmitButton className={`${btnPrimary} mt-3`}>Salvar</SubmitButton>}
                {sou && <p className="mt-2 text-sm text-mute">Você não pode mudar o próprio acesso (para não se trancar para fora).</p>}
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
