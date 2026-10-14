import Link from "next/link";
import { wa, defaultMsg, tel, site } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { PhoneIcon } from "./PhoneIcon";

// Links absolutos (/#...) funcionam na home e nas páginas internas.
const nav = [["Serviços", "/servicos"], ["Guincho", "/#guincho"], ["Peças", "/#pecas"], ["Contato", "/#local"]];

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-asphalt pt-[env(safe-area-inset-top)] text-white">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black">
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-wide">
          AM <span className="text-signal">AUTO CENTER</span>
        </Link>
        <nav aria-label="Principal" className="hidden gap-6 text-[15px] font-semibold md:flex">
          {nav.map(([t, h]) => (
            <Link key={h} href={h} className="text-white/80 hover:text-white">{t}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={tel} data-origem="cabecalho" aria-label={`Ligar para a oficina, ${site.phoneDisplay}`}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border-2 border-white/70 px-3 text-sm font-bold hover:bg-white/10">
            <PhoneIcon className="h-5 w-5" /> <span className="hidden sm:inline">Ligar</span>
          </a>
          <a href={wa(defaultMsg)} target="_blank" rel="noopener" data-origem="cabecalho"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-wa px-4 text-sm font-bold hover:brightness-110">
            <WhatsAppIcon className="h-4 w-4" /> <span className="hidden sm:inline">Chamar no</span> WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
