import { wa, defaultMsg, tel, site } from "@/lib/site";
import { QuoteSelector } from "./QuoteSelector";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { PhoneIcon } from "./PhoneIcon";
 
export function Hero() {
  return (
    <section className="border-b-[10px] border-signal bg-asphalt text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-md bg-white p-1 pr-3 text-sm font-bold text-black">
            <span className="rounded bg-black px-2 py-0.5 text-white">BR-135</span> Formosa do Rio Preto
          </p>
          <h1 className="font-display text-[clamp(2.75rem,10vw,5.25rem)] font-extrabold leading-[0.98]">
            Carro com problema? <span className="text-signal">Resolva hoje</span> na <span className="whitespace-nowrap">BR-135</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            Freios, suspensão, óleo, bateria, pneus e diagnóstico de motor em um só lugar. Descreva o problema
            no WhatsApp e receba o orçamento antes de sair de casa.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href={wa(defaultMsg)} target="_blank" rel="noopener" data-origem="hero"
               className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold hover:brightness-110">
              <WhatsAppIcon /> Pedir orçamento grátis
            </a>
            <a href={tel} data-origem="hero" aria-label={`Ligar agora, ${site.phoneDisplay}`}
               className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg border-2 border-white/70 px-6 py-3.5 text-lg font-bold hover:bg-white/10">
              <PhoneIcon className="h-5 w-5" /> Ligar agora
            </a>
          </div>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-white/90">
            <a href={site.maps} target="_blank" rel="noopener" data-origem="avaliacoes"
               className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white">
              <svg className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              4,2 no Google · 37 avaliações
            </a>
            <span className="text-white/75">1,2 mil seguidores no Instagram</span>
          </p>
        </div>
        <QuoteSelector />
      </div>
    </section>
  );
}
