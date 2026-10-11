import { createClient } from "@/lib/supabase/server";
import { papelAtual, ehGestao } from "@/lib/papel";
import { dataValida, periodo } from "@/lib/periodo";
import { input, btnPrimary, btnGhost, card } from "@/components/ui";

const RELATORIOS: [string, string, string][] = [
  ["os", "Ordens de serviço", "Cada OS aberta no período, com total, custo das peças, recebido e saldo"],
  ["pagamentos", "Pagamentos", "Tudo que entrou no período, por forma de pagamento"],
  ["estoque", "Estoque atual", "Todas as peças ativas com quantidade, custo e preço (ignora o período)"],
];

export default async function Relatorios({ searchParams }: { searchParams: Promise<{ ini?: string; fim?: string }> }) {
  const supabase = await createClient();
  if (!ehGestao(await papelAtual(supabase))) {
    return <p className="mx-auto max-w-md py-10 text-center text-mute">Esta tela é só para dono e atendente.</p>;
  }
  const sp = await searchParams;
  const padrao = periodo("30");
  const ini = dataValida(sp.ini) ? sp.ini! : padrao.ini;
  const fim = dataValida(sp.fim) ? sp.fim! : padrao.fim;
  const qs = `ini=${ini}&fim=${fim}`;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl font-bold">Relatórios</h1>
      <p className="text-mute">Arquivos CSV, prontos para abrir no Excel ou Google Planilhas.</p>

      <form action="/painel/relatorios" className="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div><label htmlFor="ini" className="mb-1 block text-sm font-semibold">De</label>
          <input id="ini" name="ini" type="date" defaultValue={ini} className={input} /></div>
        <div><label htmlFor="fim" className="mb-1 block text-sm font-semibold">Até</label>
          <input id="fim" name="fim" type="date" defaultValue={fim} className={input} /></div>
        <button className={btnPrimary}>Aplicar</button>
      </form>

      <ul className="mt-5 space-y-3">
        {RELATORIOS.map(([k, t, d]) => (
          <li key={k} className={card}>
            <p className="font-display text-2xl font-bold">{t}</p>
            <p className="text-sm text-mute">{d}</p>
            <a href={`/painel/relatorios/exportar?tipo=${k}&${qs}`} download className={`${btnGhost} mt-3 w-full`}>Baixar CSV</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
