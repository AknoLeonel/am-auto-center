import Image from "next/image";
import { wa, defaultMsg, tel, site, fotos } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { PhoneIcon } from "./PhoneIcon";

const acoes = [
  // subtítulo com cor sólida: opacidade sobre o vermelho deixa o contraste abaixo de 4,5:1
  { href: "#pedido-guincho", titulo: "Preciso de guincho", sub: "Mande sua localização", cls: "bg-alerta text-white hover:brightness-110", subCls: "text-white" },
  { href: "#pedido-orcamento", titulo: "Pedir orçamento", sub: "Sem compromisso", cls: "bg-white text-ink hover:bg-paper", subCls: "text-mute" },
  { href: "#pedido-agendar", titulo: "Agendar serviço", sub: "Escolha o dia", cls: "border-2 border-white/70 text-white hover:bg-white/10", subCls: "text-white/80" },
];

export function Hero() {
  const f = fotos.fachada;
  return (
    <section className="border-b-[10px] border-signal bg-asphalt text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-4 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 lg:py-16">
        <figure className="relative lg:order-2">
          <Image src={f.src} alt={f.alt} width={f.w} height={f.h} priority sizes="(min-width: 1024px) 460px, 100vw"
            className="h-44 w-full rounded-lg object-cover sm:h-64 lg:h-auto" />
          <figcaption className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold">
            {site.street} · {site.city}
          </figcaption>
        </figure>
        <div>
          <h1 className="font-display text-[clamp(2.6rem,9.5vw,5rem)] font-extrabold leading-[0.98]">
            Oficina, guincho e peças na <span className="whitespace-nowrap text-signal">BR-135</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Mecânica, alinhamento, elétrica e pneus em Formosa do Rio Preto. Quebrou no caminho? A gente busca.
          </p>
          <nav aria-label="Pedido rápido" className="mt-6 grid gap-3 sm:grid-cols-3">
            {acoes.map((a) => (
              <a key={a.href} href={a.href} className={`flex min-h-16 flex-col justify-center rounded-lg px-4 py-3 ${a.cls}`}>
                <span className="font-display text-2xl font-bold leading-none">{a.titulo}</span>
                <span className={`mt-1 text-sm ${a.subCls}`}>{a.sub}</span>
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={wa(defaultMsg)} target="_blank" rel="noopener" data-origem="hero"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-wa px-5 font-bold hover:brightness-110 sm:flex-none">
              <WhatsAppIcon /> WhatsApp
            </a>
            <a href={tel} data-origem="hero" aria-label={`Ligar agora, ${site.phoneDisplay}`}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-white/70 px-5 font-bold hover:bg-white/10 sm:flex-none">
              <PhoneIcon className="h-5 w-5" /> Ligar agora
            </a>
          </div>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-white/90">
            <a href={site.maps} target="_blank" rel="noopener" data-origem="avaliacoes"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-white/40 underline-offset-4 hover:decoration-white">
              <svg className="h-5 w-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              4,2 no Google · 37 avaliações
            </a>
            <span className="text-white/75">1,2 mil seguidores no Instagram</span>
          </p>
        </div>
      </div>
    </section>
  );
}
