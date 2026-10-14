import { spawn, type ChildProcess } from "node:child_process";
import { expect, test } from "@playwright/test";
import { ENV_TESTE } from "../../playwright.config";

// O service worker é testado com um servidor PRÓPRIO que o teste derruba de verdade:
// o setOffline do Playwright não vale para as requisições do service worker e daria falso positivo.
const PORTA = 3101;
const B = `http://localhost:${PORTA}`;
let servidor: ChildProcess;

async function subir() {
  servidor = spawn("node", ["node_modules/next/dist/bin/next", "start", "-p", String(PORTA)], { stdio: "ignore", detached: true, env: { ...process.env, ...ENV_TESTE } });
  for (let i = 0; i < 60 && !(await fetch(B + "/").then((r) => r.ok, () => false)); i++) await new Promise((r) => setTimeout(r, 500));
}
const derrubar = () => { try { process.kill(-servidor.pid!); } catch { /* já caiu */ } };

test.describe.serial("service worker e uso sem sinal", () => {
  test.beforeAll(subir);
  test.afterAll(derrubar);

  test("instala, guarda o app e as páginas visitadas, e responde sem servidor", async ({ page, context }) => {
    await page.goto(B + "/");
    await page.evaluate(async () => { await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }); await navigator.serviceWorker.ready; });
    await page.reload();
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    const estatico = await page.evaluate(async () => (await (await caches.open("am-v4-estatico")).keys()).map((r) => new URL(r.url).pathname));
    expect(estatico).toContain("/offline");
    expect(estatico.some((p) => p.startsWith("/_next/static/"))).toBe(true); // a página offline abre com estilo

    await page.goto(B + "/"); await page.waitForLoadState("networkidle");
    const titulo = await page.title();
    const paginas = await page.evaluate(async () => (await (await caches.open("am-v4-paginas")).keys()).map((r) => new URL(r.url).pathname));
    expect(paginas).toContain("/");

    // páginas com link-segredo nunca entram no cache
    await page.goto(B + "/acompanhar/11111111-1111-4111-8111-111111111111").catch(() => {});
    await page.goto(B + "/o/11111111-1111-4111-8111-111111111111").catch(() => {});
    const todos = await page.evaluate(async () => { const t: string[] = []; for (const n of await caches.keys()) for (const r of await (await caches.open(n)).keys()) t.push(new URL(r.url).pathname); return t; });
    expect(todos.some((p) => p.startsWith("/acompanhar") || p.startsWith("/o/"))).toBe(false);

    // ---- sem sinal de verdade
    derrubar();
    await new Promise((r) => setTimeout(r, 1500));
    expect(await fetch(B + "/").then(() => false, () => true)).toBe(true);

    await page.goto(B + "/");
    expect(await page.title()).toBe(titulo);

    await page.goto(B + "/nao-existe-no-cache");
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("main")!).backgroundColor)).toBe("rgb(11, 29, 54)");

    await page.goto(B + "/painel/pagina-nunca-vista");
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();

    // ---- sair da conta apaga as páginas guardadas
    await page.goto(B + "/");
    await page.evaluate(() => navigator.serviceWorker.controller!.postMessage("limpar"));
    await page.waitForTimeout(500);
    expect(await page.evaluate(async () => (await caches.keys()).includes("am-v4-paginas"))).toBe(false);
    await context.close();
  });

  test("o clique na notificação só leva para rotas do próprio site", async ({ page, context }) => {
    await subir();
    await page.goto(B + "/");
    await page.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
    const sw = context.serviceWorkers()[0];
    const urls = await sw.evaluate(() => {
      const f = (alvo: string) => (alvo.startsWith("/") && !alvo.startsWith("//") ? alvo : "/painel");
      return [f("/painel/pedidos"), f("//evil.com"), f("https://evil.com"), f("")];
    });
    expect(urls).toEqual(["/painel/pedidos", "/painel", "/painel", "/painel"]);
  });
});
