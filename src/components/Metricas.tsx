import { card } from "./ui";

export function Tile({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className={card}>
      <p className="text-sm font-semibold text-mute">{titulo}</p>
      <p className="font-display text-4xl font-bold leading-none tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-xs text-mute">{nota}</p>}
    </div>
  );
}

// Barras horizontais de uma série só, com o valor escrito ao lado (nunca só cor).
export function Barras({ itens }: { itens: { rotulo: string; valor: number; texto: string }[] }) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ul className="mt-2 space-y-2">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{i.rotulo}</span><span className="tabular-nums">{i.texto}</span></div>
          <div className="mt-1 h-2 rounded-full bg-line/60"><div className="h-2 rounded-full bg-brand" style={{ width: `${(i.valor / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
