import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SecaoPedido } from "@/components/SecaoPedido";
import { Guincho } from "@/components/Guincho";
import { Galeria } from "@/components/Galeria";
import { PartsCatalogLazy } from "@/components/PartsCatalogLazy";
import { PecasResumo } from "@/components/PecasResumo";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Services, Steps, Trust, Location, FinalCta, Footer } from "@/components/Sections";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { BarraAcoes } from "@/components/BarraAcoes";
import { faqHome } from "@/lib/faq-home";
import { faqSchema } from "@/lib/schema";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <JsonLd data={faqSchema(faqHome)} />
        <Hero />
        <SecaoPedido />
        <Services />
        <Guincho />
        <Galeria />
        <PartsCatalogLazy resumo={<PecasResumo />} />
        <Steps />
        <Trust />
        <Faq itens={faqHome} />
        <Location />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
      <BarraAcoes guincho="#pedido-guincho" />
    </>
  );
}
