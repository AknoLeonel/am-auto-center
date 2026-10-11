import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { Rastreio } from "@/components/Rastreio";
import { negocio, website } from "@/lib/schema";
import "./globals.css";
 
const body = Barlow({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body", display: "swap" });
const cond = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-cond", display: "swap" });
 
const title = "AM Auto Center | Mecânica em Formosa do Rio Preto - BA";
const description =
  "Mecânica, guincho e peças automotivas na BR-135, em Formosa do Rio Preto. Freios, suspensão, óleo, bateria e pneus. Peça seu orçamento pelo WhatsApp.";
 
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: "%s | AM Auto Center" },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", locale: "pt_BR", siteName: site.name, url: site.url },
  robots: { index: true, follow: true },
  icons: { apple: "/pwa-icon/180" },
};
 
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1d36",
};
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${body.variable} ${cond.variable}`}>
      <body className="antialiased">
        <JsonLd data={negocio()} />
        <JsonLd data={website()} />
        {children}
        <Rastreio />
      </body>
    </html>
  );
}
