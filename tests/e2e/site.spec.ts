import { expect, test, type Page } from "@playwright/test";

type Evento = Record<string, string | undefined>;
async function capturar(page: Page) {
  const eventos: Evento[] = [];
  await page.route("**/api/evento", (r) => { try { eventos.push(JSON.parse(r.request().postData() ?? "{}")); } catch { /* ignora */ } return r.fulfill({ status: 204 }); });
  return eventos;
}
// os links abrem outra aba/app; nos testes só interessa o clique
const semNavegar = (page: Page) =>
  page.evaluate(() => document.querySelectorAll("a[href*='whatsapp'], a[href^='tel:'], a[href*='maps.google'], a[href*='instagram']").forEach((a) => { (a as HTMLAnchorElement).target = "_self"; a.addEventListener("click", (e) => e.preventDefault()); }));
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.describe("conversões sem cookies", () => {
  test("visita uma vez por sessão, com UTM e dispositivo, sem dado pessoal", async ({ page }) => {
    const ev = await capturar(page);
    await page.goto("/?utm_source=instagram&utm_medium=bio&utm_campaign=outubro");
    await esperar(800);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ evento: "visita", pagina: "/", fonte: "instagram", meio: "bio", campanha: "outubro", dispositivo: "mobile" });
    expect(JSON.stringify(ev[0])).not.toMatch(/@|\d{9}/);
    await page.reload(); await esperar(600);
    expect(ev.filter((e) => e.evento === "visita")).toHaveLength(1);
  });

  test("cada botão informa a origem do clique", async ({ page }) => {
    const ev = await capturar(page);
    await page.goto("/?utm_source=google"); await esperar(500);
    await semNavegar(page);
    await page.locator("section a[data-origem='hero'][href*='whatsapp']").click();
    await page.locator("header a[data-origem='cabecalho'][href*='whatsapp']").click();
    await page.locator("header a[href^='tel:']").click();
    await page.locator("section a[href^='tel:'][data-origem='hero']").click();
    await page.locator("a[data-origem='avaliacoes']").click();
    await page.locator("#guincho a[href*='whatsapp']").first().click();
    await page.locator("a[href*='maps.google']").last().click();
    await page.evaluate(() => window.scrollTo(0, 1200)); await esperar(400);
    await semNavegar(page);
    await page.locator("a[data-origem='barra'][href*='whatsapp']").click();
    await esperar(400);
    const pares = ev.filter((e) => e.evento !== "visita").map((e) => `${e.evento}:${e.origem}`);
    expect(pares).toEqual(expect.arrayContaining(["whatsapp:hero", "whatsapp:cabecalho", "ligacao:cabecalho", "ligacao:hero", "mapa:avaliacoes", "whatsapp:guincho", "whatsapp:barra"]));
    expect(pares.some((p) => p.startsWith("mapa:") && p !== "mapa:avaliacoes")).toBe(true);
    expect(ev.filter((e) => e.evento !== "visita").every((e) => e.fonte === "google")).toBe(true); // a origem acompanha a sessão
  });

  test("página de serviço identifica o serviço", async ({ page }) => {
    const ev = await capturar(page);
    await page.goto("/servicos/freios"); await esperar(500);
    expect(ev[0]).toMatchObject({ evento: "visita", pagina: "/servicos/freios" });
    await semNavegar(page);
    await page.locator("a[data-origem='servico:freios']").click(); await esperar(300);
    expect(ev.some((e) => e.evento === "whatsapp" && e.origem === "servico:freios")).toBe(true);
  });

  for (const [nome, init] of [
    ["Do Not Track", () => Object.defineProperty(navigator, "doNotTrack", { value: "1" })],
    ["Global Privacy Control", () => Object.defineProperty(navigator, "globalPrivacyControl", { value: true })],
  ] as const) {
    test(`${nome}: nada é enviado`, async ({ page }) => {
      const ev = await capturar(page);
      await page.addInitScript(init);
      await page.goto("/"); await esperar(600);
      await semNavegar(page);
      await page.locator("section a[data-origem='hero'][href*='whatsapp']").click(); await esperar(300);
      expect(ev).toHaveLength(0);
    });
  }

  test("login e offline não geram eventos", async ({ page }) => {
    const ev = await capturar(page);
    for (const p of ["/login", "/offline"]) { await page.goto(p); await esperar(400); }
    expect(ev).toHaveLength(0);
  });
});

test.describe("catálogo de peças com hidratação tardia", () => {
  test("o texto está no HTML, mas o catálogo só monta ao chegar perto", async ({ page }) => {
    const js = new Set<string>();
    page.on("request", (r) => { if (r.url().endsWith(".js")) js.add(r.url()); });
    await page.goto("/"); await esperar(1500);
    await expect(page.locator("#pecas h2")).toHaveText("Peças para o seu veículo");
    await expect(page.locator("#busca")).toHaveCount(0);
    const antes = js.size;
    await page.locator("#pecas").scrollIntoViewIfNeeded(); await esperar(1500);
    await expect(page.locator("#busca")).toHaveCount(1);
    expect(js.size).toBeGreaterThan(antes);
  });
  test("/#pecas já carrega o catálogo", async ({ page }) => {
    await page.goto("/#pecas"); await esperar(2000);
    await expect(page.locator("#busca")).toHaveCount(1);
  });
  test("o botão monta o catálogo (teclado e leitor de tela)", async ({ page }) => {
    await page.goto("/"); await esperar(1200);
    await page.getByRole("button", { name: "Abrir catálogo de peças" }).click();
    await expect(page.locator("#busca")).toBeVisible();
  });
});

for (const [nome, vp] of [["celular 390", { width: 390, height: 844 }], ["celular 360", { width: 360, height: 740 }], ["desktop 1280", { width: 1280, height: 800 }]] as const) {
  test.describe(`usabilidade: ${nome}`, () => {
    test.use({ viewport: vp, isMobile: vp.width < 500 });

    test('"BR-135" fica inteiro e não há rolagem horizontal', async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const linhas = await page.evaluate(() => {
        const el = [...document.querySelectorAll("h1 span")].find((s) => s.textContent === "BR-135");
        return el ? el.getClientRects().length : -1;
      });
      expect(linhas).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test("botões de contato com área de toque de 44 px e nome acessível", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const lig = page.locator("header a[href^='tel:']");
      const b = (await lig.boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
      await expect(lig).toHaveAttribute("aria-label", /Ligar para a oficina/);
      await expect(lig).toHaveAttribute("href", "tel:+5577999642878");
      const cab = (await page.locator("header .flex.items-center.gap-2").boundingBox())!;
      expect(cab.x + cab.width).toBeLessThanOrEqual(vp.width);
      expect((await page.locator("section a[href^='tel:'][data-origem='hero']").boundingBox())!.height).toBeGreaterThanOrEqual(48);
      const selo = page.locator("a[data-origem='avaliacoes']");
      expect((await selo.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await selo.evaluate((a) => parseFloat(getComputedStyle(a).fontSize))).toBeGreaterThanOrEqual(16);
    });

    test("links dos cartões de serviço: 44 px e sem sobreposição", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const links = await page.$$eval("#servicos article a", (as) => as.map((a) => { const r = a.getBoundingClientRect(); return [r.width, r.height]; }));
      expect(links).toHaveLength(16);
      for (const [w, h] of links) { expect(w).toBeGreaterThanOrEqual(44); expect(h).toBeGreaterThanOrEqual(44); }
      const sobre = await page.$$eval("#servicos article", (arts) => arts.some((art) => {
        const [a, b] = [...art.querySelectorAll("a")].map((x) => x.getBoundingClientRect());
        return !!a && !!b && !(a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5);
      }));
      expect(sobre).toBe(false);
    });
  });
}

test.describe("pedido rápido (guincho, orçamento, agendar)", () => {
  test.use({ geolocation: { latitude: -11.0478, longitude: -45.1932 }, permissions: ["geolocation"] });
  const href = (page: Page) => page.locator("#pedido a[data-origem^='pedido:']").getAttribute("href").then((h) => decodeURIComponent(h!.split("text=")[1]));

  test("botão do topo abre a aba de guincho e a mensagem leva veículo, problema e localização", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Preciso de guincho/ }).click();
    await expect(page.locator("#pedido button[aria-pressed='true']").first()).toHaveText("Guincho");
    await page.locator("#pedido").getByRole("button", { name: "Moto" }).click();
    await page.locator("#pedido").getByRole("button", { name: "Não liga" }).click();
    await page.getByRole("button", { name: "Usar minha localização" }).click();
    await expect(page.getByRole("button", { name: /Localização incluída/ })).toBeVisible();
    const msg = await href(page);
    expect(msg).toContain("PEDIDO DE GUINCHO");
    expect(msg).toContain("Veículo: Moto");
    expect(msg).toContain("Problema: Não liga");
    expect(msg).toContain("https://maps.google.com/?q=-11.047800,-45.193200");
  });

  test("link /#pedido-agendar abre a aba de agenda; a mensagem leva serviço, dia e período", async ({ page }) => {
    await page.goto("/#pedido-agendar");
    await expect(page.getByRole("heading", { name: "Agendar serviço" })).toBeVisible();
    await page.locator("#p-serv").selectOption("Troca de óleo");
    await page.locator("#p-dia").fill("2031-03-14");
    await page.locator("#pedido").getByRole("button", { name: "Tarde" }).click();
    const msg = await href(page);
    expect(msg).toContain("Serviço: Troca de óleo");
    expect(msg).toMatch(/Dia: sexta-feira, 14\/03, de tarde/);
  });

  test("página de serviço já vem com o orçamento daquele serviço marcado", async ({ page }) => {
    await page.goto("/servicos/freios");
    await expect(page.locator("#pedido").getByRole("button", { name: "Freios", pressed: true })).toBeVisible();
    expect(await href(page)).toContain("Serviço: Freios");
  });

  test("o pedido é registrado para o painel ao enviar", async ({ page }) => {
    await page.goto("/#pedido-orcamento");
    await semNavegar(page);
    const enviado = page.waitForRequest((r) => r.method() === "POST" && (r.headers()["next-action"] ?? "") !== "");
    await page.locator("#pedido a[data-origem='pedido:orcamento']").click();
    expect((await enviado).postData()).toContain("orcamento");
  });
});

test("barra de ações no celular aparece ao rolar e leva ao guincho", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Ações rápidas" })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 1500));
  const barra = page.getByRole("navigation", { name: "Ações rápidas" });
  await expect(barra).toBeVisible();
  await barra.getByRole("link", { name: "Guincho" }).click();
  await expect(page.getByRole("heading", { name: "Pedir guincho agora" })).toBeVisible();
});

test("navegação por teclado e FAQ", async ({ page }) => {
  await page.goto("/servicos/pneus");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.textContent)).toMatch(/Pular para o conteúdo/);
  const d = page.locator("details").first();
  await d.locator("summary").click();
  expect(await d.evaluate((x: HTMLDetailsElement) => x.open)).toBe(true);
  await page.getByRole("link", { name: "Início", exact: true }).first().click();
  await page.waitForURL("**/");
});
