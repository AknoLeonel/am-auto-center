import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";
 
const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-cond", display: "swap" });
 
const title = "AM Auto Center | Mecânica em Formosa do Rio Preto - BA";
const description =
  "Mecânica, guincho e peças automotivas na BR-135, em Formosa do Rio Preto. Freios, suspensão, óleo, bateria e pneus. Peça seu orçamento pelo WhatsApp.";
 
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", locale: "pt_BR", siteName: site.name, url: site.url },
  robots: { index: true, follow: true },
};
 
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1d36",
};
 
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  name: site.name,
  url: site.url,
  telephone: `+${site.phone}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.street,
    addressLocality: site.city,
    addressRegion: site.state,
    postalCode: site.zip,
    addressCountry: "BR",
  },
  sameAs: [site.instagram],
  makesOffer: ["Diagnóstico de motor", "Freios", "Pneus", "Suspensão e direção", "Troca de óleo", "Bateria", "Guincho", "Venda de peças automotivas"].map(
    (n) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: n } })
  ),
};
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${cond.variable}`}>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
