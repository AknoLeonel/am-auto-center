import { parts, vehicles } from "@/lib/parts";

// Versão estática (sem JavaScript) da seção de peças: o que os buscadores e a primeira pintura veem.
export function PecasResumo() {
  const categorias = Array.from(new Set(parts.map((p) => p.category)));
  return (
    <section id="pecas" className="px-4 pt-14 lg:pt-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Peças para o seu veículo</h2>
        <p className="mt-2 max-w-xl text-mute">
          Escolha o tipo de veículo, monte sua lista e envie o pedido pelo WhatsApp. Respondemos com disponibilidade e valores.
        </p>
        <p className="mt-4 text-sm font-semibold">Para {vehicles.map((v) => v.label.toLowerCase()).join(", ")}.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categorias.map((c) => <li key={c} className="rounded-full border-2 border-line bg-white px-4 py-1.5 text-sm font-semibold">{c}</li>)}
        </ul>
      </div>
    </section>
  );
}
