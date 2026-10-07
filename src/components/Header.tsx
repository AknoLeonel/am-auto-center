import { wa, defaultMsg } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

const nav = [["Serviços", "#servicos"], ["Guincho", "#guincho"], ["Peças", "#pecas"], ["Contato", "#local"]];

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-asphalt pt-[env(safe-area-inset-top)] text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <a href="#" className="font-display text-2xl font-extrabold tracking-wide">
          AM <span className="text-signal">AUTO CENTER</span>
        </a>
        <nav aria-label="Principal" className="hidden gap-6 text-[15px] font-semibold md:flex">
          {nav.map(([t, h]) => (
            <a key={h} href={h} className="text-white/80 hover:text-white">{t}</a>
          ))}
        </nav>
        <a href={wa(defaultMsg)} target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 rounded-lg bg-wa px-4 py-2 text-sm font-bold hover:brightness-110">
          <WhatsAppIcon className="h-4 w-4" /> <span className="hidden sm:inline">Chamar no</span> WhatsApp
        </a>
      </div>
    </header>
  );
}
