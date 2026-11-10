import Image from "next/image";
import { fotos } from "@/lib/site";

const itens = [
  [fotos.alinhamento, "Rampa de alinhamento"],
  [fotos.utv, "Alinhamos até UTV"],
  [fotos.elevador, "Elevadores para picape e caminhonete"],
  [fotos.fachada, "Pátio e loja de peças"],
] as const;

export function Galeria() {
  return (
    <section aria-labelledby="galeria-t" className="bg-white px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 id="galeria-t" className="font-display text-4xl font-bold sm:text-5xl">Estrutura para o serviço completo</h2>
        <p className="mt-2 max-w-xl text-mute">Rampa de alinhamento, elevadores e loja de peças no mesmo lugar: o seu carro não precisa rodar a cidade.</p>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {itens.map(([f, legenda]) => (
            <li key={f.src}>
              <figure>
                <Image src={f.src} alt={f.alt} width={f.w} height={f.h} sizes="(min-width: 1024px) 280px, 50vw"
                  className="aspect-[4/5] w-full rounded-md object-cover" />
                <figcaption className="mt-2 text-sm font-semibold">{legenda}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
