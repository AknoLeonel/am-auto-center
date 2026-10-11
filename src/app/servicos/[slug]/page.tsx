import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer, FinalCta } from "@/components/Sections";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { site, wa } from "@/lib/site";
import { servicosDetalhe, servicoPorSlug, CIDADE } from "@/lib/servicos";
import { breadcrumb, faqSchema, servicoSchema } from "@/lib/schema";

export const dynamicParams = false;
export const generateStaticParams = () => servicosDetalhe.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = servicoPorSlug((await params).slug);
  if (!s) return {};
  const url = `/servicos/${s.slug}`;
  return {
    title: { absolute: s.metaTitle },
    description: s.metaDesc,
    alternates: { canonical: url },
    openGraph: { title: s.metaTitle, description: s.metaDesc, url, type: "website", locale: "pt_BR", siteName: site.name },
  };
}

export default async function ServicoPagina({ params }: { params: Promise<{ slug: string }> }) {
  const s = servicoPorSlug((await params).slug);
  if (!s) notFound();
  const relacionados = s.relacionados.map((r) => servicoPorSlug(r)).filter((x) => !!x);

  return (
    <>
      <Header />
      <main id="conteudo">
        <JsonLd data={servicoSchema(s)} />
        <JsonLd data={faqSchema(s.faq)} />
        <JsonLd data={breadcrumb([{ nome: "Início", caminho: "/" }, { nome: "Serviços", caminho: "/servicos" }, { nome: s.nome, caminho: `/servicos/${s.slug}` }])} />

        <section className="border-b-[10px] border-signal bg-asphalt text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
            <nav aria-label="Você está em" className="text-sm text-white/70">
              <ol className="flex flex-wrap items-center gap-x-2">
                <li><Link href="/" className="underline">Início</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/servicos" className="underline">Serviços</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-white">{s.nome}</li>
              </ol>
            </nav>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1]">{s.h1}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">{s.intro}</p>
            <a href={wa(s.msg)} target="_blank" rel="noopener" data-origem={`servico:${s.slug}`}
              className="mt-6 inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold text-white hover:brightness-110">
              <WhatsAppIcon /> Pedir orçamento no WhatsApp
            </a>
            <p className="mt-3 text-sm text-white/70">{site.street} · {CIDADE}/{site.state}</p>
          </div>
        </section>

        <section className="px-4 py-14 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">{s.sinaisTitulo}</h2>
              <ul className="mt-5 space-y-3">
                {s.sinais.map((x) => (
                  <li key={x} className="flex gap-3 rounded-md border border-line bg-white p-4"><span aria-hidden className="font-bold text-brand">•</span><span>{x}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-4xl font-bold sm:text-5xl">{s.slug === "guincho" ? "Como funciona" : "O que fazemos"}</h2>
              <ol className="mt-5 space-y-3">
                {s.fazemos.map((x, i) => (
                  <li key={x} className="flex gap-4 border-t-4 border-signal bg-white p-4">
                    <span className="font-display text-3xl font-extrabold leading-none text-brand">{i + 1}</span><span>{x}</span>
                  </li>
                ))}
              </ol>
              {s.dica && (
                <aside className="mt-6 rounded-md border-l-[6px] border-l-brand bg-white p-5">
                  <h3 className="font-display text-2xl font-bold">{s.dica.titulo}</h3>
                  <p className="mt-1 text-mute">{s.dica.texto}</p>
                </aside>
              )}
            </div>
          </div>
        </section>

        <Faq itens={s.faq} />

        <section className="px-4 pb-14 lg:pb-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Outros serviços</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {relacionados.map((r) => (
                <li key={r.slug}>
                  <Link href={`/servicos/${r.slug}`} className="block rounded-md border border-line border-l-[6px] border-l-signal bg-white p-4 hover:border-brand">
                    <span className="font-display text-2xl font-bold">{r.nome}</span>
                    <span className="mt-1 block text-sm text-mute">{r.metaDesc.split(/[.?]/)[0]}.</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
