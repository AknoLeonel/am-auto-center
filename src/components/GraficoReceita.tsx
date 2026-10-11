import { brl, diaBR } from "@/lib/painel";

type Dia = { dia: string; receita: number; os: number };

// Barras de uma série só (receita por dia): sem legenda, grade discreta, rótulos só nos extremos.
// Cada barra é focável e tem tooltip nativo; a tabela completa fica logo abaixo para leitores de tela.
export function GraficoReceita({ dias }: { dias: Dia[] }) {
  const max = Math.max(...dias.map((d) => d.receita), 0);
  const total = dias.reduce((s, d) => s + d.receita, 0);

  if (max === 0) return <p className="mt-3 text-mute">Nenhuma OS entregue neste período.</p>;

  return (
    <figure className="mt-3">
      <figcaption className="sr-only">Receita por dia de entrega, total {brl(total)}</figcaption>
      <div className="flex gap-2">
        <div aria-hidden className="flex w-16 shrink-0 flex-col justify-between text-right text-xs text-mute">
          <span>{brl(max)}</span><span>R$ 0</span>
        </div>
        <div className="relative h-40 flex-1">
          <div aria-hidden className="absolute inset-x-0 top-0 border-t border-line" />
          <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-line/60" />
          <div className="absolute inset-0 flex items-end gap-[2px] border-b border-ink/30">
            {dias.map((d) => (
              <div key={d.dia} tabIndex={0} title={`${diaBR(d.dia)}: ${brl(d.receita)} · ${d.os} OS`}
                aria-label={`${diaBR(d.dia)}: ${brl(d.receita)}, ${d.os} ordens entregues`}
                className="min-w-[2px] flex-1 rounded-t-[3px] bg-brand outline-offset-2 hover:brightness-125 focus-visible:brightness-125"
                style={{ height: `${Math.max((d.receita / max) * 100, d.receita > 0 ? 2 : 0)}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="mt-1 flex justify-between pl-[4.5rem] text-xs text-mute">
        <span>{diaBR(dias[0].dia).slice(0, 5)}</span>
        <span>{diaBR(dias[dias.length - 1].dia).slice(0, 5)}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-brand">Ver como tabela</summary>
        <table className="w-full text-left">
          <thead><tr className="border-b border-line"><th className="py-1">Dia</th><th>OS</th><th className="text-right">Receita</th></tr></thead>
          <tbody>
            {dias.filter((d) => d.os > 0).map((d) => (
              <tr key={d.dia} className="border-b border-line/60"><td className="py-1">{diaBR(d.dia)}</td><td>{d.os}</td><td className="text-right tabular-nums">{brl(d.receita)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
