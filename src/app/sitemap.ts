import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { servicosDetalhe } from "@/lib/servicos";

// lastModified vem da data de revisão do conteúdo (site.ts), não de "agora": datas falsas de atualização prejudicam a confiança dos buscadores.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(site.conteudoAtualizadoEm);
  return [
    { url: site.url, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/servicos`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...servicosDetalhe.map((s) => ({ url: `${site.url}/servicos/${s.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
