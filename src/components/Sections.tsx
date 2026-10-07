import { services, site, wa, defaultMsg } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";
 
export function Services() {
  return (
    <section id="servicos" className="px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">O que fazemos pelo seu carro</h2>
        <p className="mt-2 max-w-xl text-mute">Seis serviços para manter você na estrada com segurança.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article key={s.id} className="flex flex-col rounded-md border border-line border-l-[6px] border-l-signal bg-white p-5">
              <h3 className="font-display text-3xl font-bold leading-none">{s.title}</h3>
              <p className="mt-2 text-[15.5px] text-mute">{s.text}</p>
              <a href={wa(s.msg)} target="_blank" rel="noopener"
                 className="mt-auto pt-4 font-bold text-wa hover:underline">
                Pedir orçamento
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
 
export function Steps() {
  const steps = [
    ["Conte o problema", "Mande uma mensagem no WhatsApp. Se puder, inclua foto ou vídeo."],
    ["Receba o orçamento", "Nossa equipe responde com valor e prazo."],
    ["Traga o carro", "Venha até a BR-135 e saia com o serviço feito."],
  ];
  return (
    <section className="bg-asphalt px-4 py-14 text-white lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Orçamento em 3 passos</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="border-t-4 border-signal pt-4">
              <span className="font-display text-5xl font-extrabold leading-none text-signal">{i + 1}</span>
              <h3 className="mt-1 font-display text-3xl font-bold">{t}</h3>
              <p className="mt-1 text-white/75">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
 
export function Trust() {
  const items = [
    ["Avaliação 4,2 no Google", "37 clientes já avaliaram o nosso atendimento."],
    ["Comunidade ativa", "Mais de 1,2 mil pessoas acompanham a oficina no Instagram."],
    ["Fácil de achar", "Na BR-135, com acesso para quem mora aqui e para quem está de passagem."],
    ["Fale direto com a oficina", "O WhatsApp é o canal oficial, sem atendente robô."],
  ];
  return (
    <section className="px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">Oficina de confiança na sua cidade</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map(([t, d]) => (
            <div key={t} className="rounded-md border border-line bg-white p-5">
              <h3 className="font-display text-2xl font-bold">{t}</h3>
              <p className="mt-1 text-mute">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
 
export function Location() {
  return (
    <section id="local" className="px-4 pb-14 lg:pb-20">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Venha nos visitar</h2>
          <dl className="mt-5 space-y-4">
            <div><dt className="font-bold">Endereço</dt><dd className="text-mute">{site.street}<br />{site.city} - {site.state}, {site.zip}</dd></div>
            <div><dt className="font-bold">Horário</dt><dd className="text-mute">{site.hours}</dd></div>
            <div><dt className="font-bold">WhatsApp</dt><dd className="text-mute">{site.phoneDisplay}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={wa(defaultMsg)} target="_blank" rel="noopener"
               className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 font-bold text-white hover:brightness-110">
              <WhatsAppIcon /> Chamar no WhatsApp
            </a>
            <a href={site.maps} target="_blank" rel="noopener"
               className="inline-flex min-h-13 items-center justify-center rounded-lg border-2 border-ink px-6 py-3.5 font-bold hover:bg-ink hover:text-white">
              Ver rota no mapa
            </a>
          </div>
        </div>
        <div className="space-y-4 md:pt-14">
          <div className="rounded-md border border-line bg-white p-5">
            <h3 className="font-display text-2xl font-bold">Siga no Instagram</h3>
            <p className="mt-1 text-mute"><a className="font-semibold underline" href={site.instagram} target="_blank" rel="noopener">@centeramauto</a>: serviços feitos e novidades da oficina.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
 
export function FinalCta() {
  return (
    <section className="bg-brand px-4 py-14 text-center text-white">
      <h2 className="font-display text-4xl font-extrabold sm:text-6xl">Não deixe o problema crescer.</h2>
      <p className="mx-auto mt-3 max-w-xl text-lg">Quanto antes você diagnostica, menor o custo do reparo. Mande uma mensagem agora.</p>
      <a href={wa(defaultMsg)} target="_blank" rel="noopener"
         className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-wa px-7 py-3.5 text-lg font-bold text-white hover:brightness-110">
        <WhatsAppIcon /> Falar com a AM Auto Center
      </a>
    </section>
  );
}
 
export function Footer() {
  return (
    <footer className="bg-asphalt px-4 pb-24 pt-8 text-sm text-white/60">
      <div className="mx-auto max-w-6xl">
        {site.name} · {site.street}, {site.city} - {site.state} ·{" "}
        <a className="text-white underline" href={site.instagram} target="_blank" rel="noopener">Instagram</a>
      </div>
    </footer>
  );
}
 
export function WhatsAppFloat() {
  return (
    <a href={wa(defaultMsg)} target="_blank" rel="noopener" aria-label="Chamar no WhatsApp"
       style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
       className="fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-wa px-5 py-3.5 font-bold text-white shadow-xl hover:brightness-110">
      <WhatsAppIcon className="h-6 w-6" /> WhatsApp
    </a>
  );
}
