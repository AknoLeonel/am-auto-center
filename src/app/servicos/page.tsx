import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer, FinalCta } from "@/components/Sections";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";
import { servicosDetalhe, CIDADE } from "@/lib/servicos";
import { breadcrumb } from "@/lib/schema";

const titulo = "Serviços de mecânica em Formosa do Rio Preto | AM Auto Center";
const descricao = "Freios, suspensão, pneus, óleo, bateria, diagnóstico de motor e guincho na BR-135, em Formosa do Rio Preto (BA). Veja os serviços e peça orçamento pelo WhatsApp.";

export const metadata: Metadata = {
  title: { absolute: titulo },
  description: descricao,
  alternates: { canonical: "/servicos" },
  openGraph: { title: titulo, description: descricao, url: "/servicos", type: "website", locale: "pt_BR", siteName: site.name, images: ["/opengraph-image"] },
};

export default function Servicos() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <JsonLd data={breadcrumb([{ nome: "Início", caminho: "/" }, { nome: "Serviços", caminho: "/servicos" }])} />
        <JsonLd data={{
          "@context": "https://schema.org", "@type": "ItemList", name: "Serviços da AM Auto Center",
          itemListElement: servicosDetalhe.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.nome, url: `${site.url}/servicos/${s.slug}` })),
        }} />
        <section className="border-b-[10px] border-signal bg-asphalt text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
            <h1 className="max-w-3xl font-display text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1]">Serviços da oficina em {CIDADE}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">
              Mecânica, guincho e peças na BR-135. Escolha o serviço para ver os sinais, o que fazemos e as dúvidas mais comuns.
            </p>
          </div>
        </section>
        <section className="px-4 py-14 lg:py-20">
          <ul className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicosDetalhe.map((s) => (
              <li key={s.slug}>
                <Link href={`/servicos/${s.slug}`} className="flex h-full flex-col rounded-md border border-line border-l-[6px] border-l-signal bg-white p-5 hover:border-brand">
                  <h2 className="font-display text-3xl font-bold leading-none">{s.nome}</h2>
                  <p className="mt-2 text-[15.5px] text-mute">{s.intro.split(/(?<=\.)\s/)[0]}</p>
                  <span className="mt-auto pt-4 font-bold text-brand">Ver detalhes →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
