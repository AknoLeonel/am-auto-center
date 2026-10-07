import { wa, defaultMsg } from "@/lib/site";
import { QuoteSelector } from "./QuoteSelector";
import { WhatsAppIcon } from "./WhatsAppIcon";
 
export function Hero() {
  return (
    <section className="border-b-[10px] border-signal bg-asphalt text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-md bg-white p-1 pr-3 text-sm font-bold text-black">
            <span className="rounded bg-black px-2 py-0.5 text-white">BR-135</span> Formosa do Rio Preto
          </p>
          <h1 className="font-display text-[clamp(2.75rem,10vw,5.25rem)] font-extrabold leading-[0.98]">
            Carro com problema? <span className="text-signal">Resolva hoje</span> na BR-135.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Freios, suspensão, óleo, bateria, pneus e diagnóstico de motor em um só lugar. Descreva o problema
            no WhatsApp e receba o orçamento antes de sair de casa.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={wa(defaultMsg)} target="_blank" rel="noopener"
               className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold hover:brightness-110">
              <WhatsAppIcon /> Pedir orçamento grátis
            </a>
            <a href="#servicos"
               className="inline-flex min-h-13 items-center justify-center rounded-lg border-2 border-white/70 px-6 py-3.5 text-lg font-bold hover:bg-white/10">
              Ver serviços
            </a>
          </div>
          <p className="mt-6 text-sm text-white/65">
            Avaliação 4,2 no Google (37 avaliações) · 1,2 mil seguidores no Instagram
          </p>
        </div>
        <QuoteSelector />
      </div>
    </section>
  );
}
