import { createClient } from "@/lib/supabase/server";
import { diagnosticar, migrationsFaltando, type Item } from "@/lib/diagnostico";
import { card } from "@/components/ui";

export const dynamic = "force-dynamic";

const REPO = "https://github.com/AknoLeonel/am-auto-center";

// Mostra o que falta para o sistema funcionar (banco e configuração). Só diz se cada variável existe, nunca o valor.
export default async function Diagnostico() {
  const supabase = await createClient();
  const itens = await diagnosticar(supabase, process.env);
  const faltaObrigatorio = itens.filter((i) => !i.ok && !i.opcional);
  const migs = migrationsFaltando(itens);
  const grupos = [...new Set(itens.map((i) => i.grupo))];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-bold">Diagnóstico do sistema</h1>
      <p className="text-mute">Confere se o banco de dados e as configurações estão completos.</p>

      {faltaObrigatorio.length === 0 ? (
        <p role="status" className="mt-4 rounded-md border-l-[6px] border-l-wa bg-white p-4 font-semibold">✔ Tudo certo com o essencial. Itens opcionais abaixo.</p>
      ) : (
        <div role="alert" className="mt-4 rounded-md border-l-[6px] border-l-red-600 bg-white p-4">
          <p className="font-display text-2xl font-bold">Faltam {faltaObrigatorio.length} {faltaObrigatorio.length === 1 ? "item" : "itens"}</p>
          {migs.length > 0 && (
            <>
              <p className="mt-1">O banco de dados está desatualizado. Rode <code className="rounded bg-paper px-1">npm run db:aplicar</code> no VS Code
                (instruções no passo 2 do README) ou cole os arquivos abaixo, <strong>um por vez e na ordem</strong>, no <strong>SQL Editor</strong> do Supabase.
                Use o botão <strong>Copy raw file</strong> do GitHub e confira se a última linha colada começa com <code className="rounded bg-paper px-1">-- FIM</code>.</p>
              <p className="mt-2 text-sm text-mute">Atualizações que faltam:</p>
              <ol className="list-decimal pl-5 text-sm">
                {migs.map((m) => (
                  <li key={m}><a className="text-brand underline" href={`${REPO}/blob/master/supabase/migrations/${m}`} target="_blank" rel="noopener">{m}</a></li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      {grupos.map((g) => (
        <section key={g} className={`${card} mt-4`}>
          <h2 className="font-display text-2xl font-bold">{g}</h2>
          <ul className="mt-2 divide-y divide-line">
            {itens.filter((i) => i.grupo === g).map((i: Item) => (
              <li key={i.nome} className="flex items-start gap-3 py-2">
                <span aria-hidden className={`mt-0.5 font-bold ${i.ok ? "text-wa" : i.opcional ? "text-mute" : "text-red-700"}`}>{i.ok ? "✔" : i.opcional ? "–" : "✖"}</span>
                <span>
                  <span className="font-semibold">{i.nome}</span>
                  <span className="sr-only">{i.ok ? ": ok" : i.opcional ? ": opcional, não configurado" : ": faltando"}</span>
                  {i.detalhe && <span className="block text-sm text-mute">{i.detalhe}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
