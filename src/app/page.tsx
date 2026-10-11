import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Shortcuts } from "@/components/Shortcuts";
import { Towing } from "@/components/Towing";
import { PartsCatalogLazy } from "@/components/PartsCatalogLazy";
import { PecasResumo } from "@/components/PecasResumo";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { Services, Steps, Trust, Location, FinalCta, Footer } from "@/components/Sections";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { faqHome } from "@/lib/faq-home";
import { faqSchema } from "@/lib/schema";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <JsonLd data={faqSchema(faqHome)} />
        <Hero />
        <Shortcuts />
        <Services />
        <Towing />
        <PartsCatalogLazy resumo={<PecasResumo />} />
        <Steps />
        <Trust />
        <Faq itens={faqHome} />
        <Location />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
