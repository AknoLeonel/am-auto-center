import { describe, expect, it } from "vitest";
import { negocio, servicoSchema, faqSchema, breadcrumb } from "@/lib/schema";
import { servicosDetalhe } from "@/lib/servicos";
import { services, site } from "@/lib/site";
import sitemap from "@/app/sitemap";
import { faqHome } from "@/lib/faq-home";
import { CHECKLIST } from "@/lib/checklist";

describe("conteúdo das páginas de serviço (SEO)", () => {
  it("slugs únicos e em formato de URL", () => {
    const slugs = servicosDetalhe.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it.each(servicosDetalhe.map((s) => [s.slug, s] as const))("%s: títulos, descrição e FAQ completos", (_, s) => {
    expect(s.metaTitle.length).toBeLessThanOrEqual(65);
    expect(s.metaDesc.length).toBeGreaterThan(80);
    expect(s.metaDesc.length).toBeLessThanOrEqual(165);
    expect(s.faq.length).toBeGreaterThanOrEqual(3);
    expect(s.sinais.length).toBeGreaterThanOrEqual(4);
    expect(s.fazemos.length).toBeGreaterThanOrEqual(3);
    for (const r of s.relacionados) expect(servicosDetalhe.some((x) => x.slug === r)).toBe(true);
    expect(s.relacionados).not.toContain(s.slug);
  });
  it("títulos não se repetem", () => {
    const t = servicosDetalhe.map((s) => s.metaTitle); expect(new Set(t).size).toBe(t.length);
  });
  it("todo serviço da home tem página", () => {
    for (const s of services) expect(servicosDetalhe.some((d) => d.id === s.id)).toBe(true);
  });
  it("não promete preço nem prazo fixo nos textos", () => {
    const tudo = JSON.stringify(servicosDetalhe) + JSON.stringify(faqHome);
    expect(tudo).not.toMatch(/R\$\s?\d/);
    expect(tudo).not.toMatch(/\b(em|de) \d+ ?(min|minutos|horas)\b/i);
    expect(tudo).not.toMatch(/garantia de \d+/i);
  });
});

describe("dados estruturados", () => {
  it("negócio só com dados confirmados (sem avaliação, horário por dia ou coordenadas)", () => {
    const n = negocio() as Record<string, unknown>;
    expect(n["@type"]).toBe("AutoRepair");
    expect(n).not.toHaveProperty("aggregateRating");
    expect(n).not.toHaveProperty("openingHoursSpecification");
    expect(n).not.toHaveProperty("geo");
    expect(n.telephone).toBe(`+${site.phoneTel}`);
  });
  it("serviço, FAQ e migalhas têm o formato do schema.org", () => {
    const s = servicosDetalhe[0];
    expect(servicoSchema(s)["@type"]).toBe("Service");
    expect(faqSchema(s.faq).mainEntity).toHaveLength(s.faq.length);
    expect(breadcrumb([{ nome: "A", caminho: "/" }, { nome: "B", caminho: "/b" }]).itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
  it("sitemap lista home, /servicos e cada serviço, com data fixa de revisão", () => {
    const urls = sitemap().map((u) => u.url);
    expect(urls).toHaveLength(2 + servicosDetalhe.length);
    expect(urls).toContain(`${site.url}/servicos/freios`);
    expect(new Set(sitemap().map((u) => String(u.lastModified))).size).toBe(1);
  });
});

describe("checklist", () => {
  it("itens únicos em cada momento", () => {
    for (const m of Object.values(CHECKLIST)) expect(new Set(m.itens).size).toBe(m.itens.length);
  });
});
