import { expect, test } from "@playwright/test";
import { servicosDetalhe } from "../../src/lib/servicos";

test.describe("páginas públicas", () => {
  const rotas = ["/", "/servicos", ...servicosDetalhe.map((s) => `/servicos/${s.slug}`)];

  for (const rota of rotas) {
    test(`${rota}: abre, tem um h1, título, descrição, canonical e dados estruturados válidos`, async ({ page }) => {
      const r = await page.goto(rota);
      expect(r?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      expect((await page.title()).length).toBeGreaterThan(20);
      expect(((await page.locator('meta[name="description"]').getAttribute("content")) ?? "").length).toBeGreaterThan(80);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain("https://amautocenter.example");
      const blocos = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocos.length).toBeGreaterThanOrEqual(2);
      for (const b of blocos) expect(() => JSON.parse(b)).not.toThrow();
      // sem JavaScript quebrado
    });
  }

  test("slug inexistente: 404", async ({ request }) => {
    expect((await request.get("/servicos/nao-existe")).status()).toBe(404);
  });

  test("sem erros no console em nenhuma página principal", async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", (e) => erros.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) erros.push(m.text()); });
    for (const rota of ["/", "/servicos", "/servicos/freios"]) { await page.goto(rota, { waitUntil: "networkidle" }); }
    expect(erros).toEqual([]);
  });
});

test.describe("infraestrutura", () => {
  test("sitemap e robots", async ({ request }) => {
    const sm = await (await request.get("/sitemap.xml")).text();
    expect((sm.match(/<loc>/g) ?? []).length).toBe(2 + servicosDetalhe.length);
    expect(sm).toContain("https://amautocenter.example/servicos/freios");
    const rb = await (await request.get("/robots.txt")).text();
    for (const bloqueado of ["/painel", "/login", "/o/", "/acompanhar/"]) expect(rb).toContain(`Disallow: ${bloqueado}`);
    expect(rb).toContain("Sitemap: https://amautocenter.example/sitemap.xml");
  });

  test("cabeçalhos de segurança e service worker sem cache", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
    const sw = (await request.get("/sw.js")).headers();
    expect(sw["cache-control"]).toContain("no-store");
    expect(sw["content-type"]).toContain("javascript");
  });

  test("manifest do app com atalhos", async ({ request }) => {
    const m = await (await request.get("/manifest.webmanifest")).json();
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/painel");
    expect(m.shortcuts.map((s: { url: string }) => s.url)).toEqual(["/painel/nova", "/painel/quadro", "/painel/agenda"]);
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
  });

  test("o painel exige login (redireciona e guarda o destino)", async ({ request }) => {
    const r = await request.get("/painel/estoque", { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(r.status());
    expect(r.headers()["location"]).toContain("/login?next=%2Fpainel%2Festoque");
  });

  test("login abre e tem os campos certos", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });

  test("páginas com link-segredo não são indexáveis", async ({ request }) => {
    expect((await (await request.get("/offline")).text())).toContain("noindex");
  });
});
