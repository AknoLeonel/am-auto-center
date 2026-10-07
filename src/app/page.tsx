import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Shortcuts } from "@/components/Shortcuts";
import { Towing } from "@/components/Towing";
import { PartsCatalog } from "@/components/PartsCatalog";
import { Services, Steps, Trust, Location, FinalCta, Footer } from "@/components/Sections";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Shortcuts />
        <Services />
        <Towing />
        <PartsCatalog />
        <Steps />
        <Trust />
        <Location />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
