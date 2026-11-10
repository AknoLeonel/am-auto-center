import Image from "next/image";
import { fotos, wa } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function Guincho() {
  const f = fotos.guincho;
  return (
    <section id="guincho" className="px-4 py-14 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <Image src={f.src} alt={f.alt} width={f.w} height={f.h} sizes="(min-width: 1024px) 560px, 100vw"
          className="h-auto w-full rounded-lg object-cover" />
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">Quebrou no caminho? A gente busca.</h2>
          <p className="mt-3 text-lg text-mute">
            Guincho próprio para carro, moto, SUV, caminhão e van. Mande a localização e confirmamos o prazo e o valor.
          </p>
          <div className="mt-5 rounded-lg border-l-[6px] border-l-alerta bg-white p-4">
            <h3 className="font-display text-2xl font-bold">Enquanto espera, com segurança</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-mute">
              <li>Ligue o pisca-alerta e, se puder, saia do veículo com cuidado.</li>
              <li>Posicione o triângulo de sinalização a uma distância segura.</li>
              <li>Fique longe da pista, atrás do guard-rail ou no acostamento.</li>
            </ul>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a href="#pedido-guincho" className="inline-flex min-h-13 items-center justify-center rounded-lg bg-alerta px-6 text-lg font-bold text-white hover:brightness-110">
              Pedir guincho agora
            </a>
            <a href={wa("Olá! Preciso de guincho.")} target="_blank" rel="noopener" data-origem="guincho"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg border-2 border-wa px-6 font-bold text-wa hover:bg-wa hover:text-white">
              <WhatsAppIcon /> Direto no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
