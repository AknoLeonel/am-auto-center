import { site } from "./site";
import { CIDADE, servicosDetalhe, type Servico } from "./servicos";

export const negocioId = `${site.url}/#negocio`;
const cidade = { "@type": "City", name: CIDADE, containedInPlace: { "@type": "AdministrativeArea", name: "Bahia" } };

// Só dados confirmados: sem avaliações, sem horário por dia e sem coordenadas (a oficina ainda não informou).
export function negocio() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": negocioId,
    name: site.name,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    telephone: `+${site.phone}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.street,
      addressLocality: site.city,
      addressRegion: site.state,
      postalCode: site.zip,
      addressCountry: "BR",
    },
    areaServed: cidade,
    hasMap: site.maps,
    sameAs: [site.instagram],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços",
      itemListElement: servicosDetalhe.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.nome, url: `${site.url}/servicos/${s.slug}` },
      })),
    },
  };
}

export const website = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
  inLanguage: "pt-BR",
  publisher: { "@id": negocioId },
});

export function servicoSchema(s: Servico) {
  const url = `${site.url}/servicos/${s.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#servico`,
    name: s.nome,
    serviceType: s.nome,
    description: s.metaDesc,
    url,
    provider: { "@id": negocioId },
    areaServed: cidade,
  };
}

export const breadcrumb = (itens: { nome: string; caminho: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: itens.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: i.nome, item: `${site.url}${i.caminho}` })),
});

export const faqSchema = (faq: { p: string; r: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
});
