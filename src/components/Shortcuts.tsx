const items = [
  ["Oficina mecânica", "Freios, suspensão, óleo, bateria e diagnóstico.", "#servicos"],
  ["Guincho", "Quebrou? Mandamos buscar o seu veículo.", "#guincho"],
  ["Peças", "Monte a lista e peça pelo WhatsApp.", "#pecas"],
];

export function Shortcuts() {
  return (
    <nav aria-label="Atalhos" className="px-4 pt-8">
      <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
        {items.map(([t, d, h]) => (
          <a key={t} href={h} className="rounded-md border border-line border-l-[6px] border-l-brand bg-white p-4 hover:border-brand">
            <span className="block font-display text-2xl font-bold">{t}</span>
            <span className="text-sm text-mute">{d}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
