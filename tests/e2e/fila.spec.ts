import { build } from "esbuild";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

// A fila offline roda no navegador (IndexedDB). Aqui ela é empacotada com um cliente Supabase falso e testada
// contra um "servidor" simulado em http://t.local, que também sabe simular a rede caída.
let bundle = "";
test.beforeAll(async () => {
  const r = await build({
    entryPoints: [join(__dirname, "support/fila-entry.ts")], bundle: true, write: false, format: "iife",
    plugins: [{ name: "stub", setup(b) { b.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({ path: join(__dirname, "support/stub-supabase-client.ts") })); } }],
  });
  bundle = r.outputFiles[0].text;
});

type Chamada = { id: string; tipo: string; dados: Record<string, unknown> };
type Ctx = { page: Page; chamadas: Chamada[]; modo: { v: "ok" | "500" | "401" | "422"; semRede: boolean } };

async function abrir(page: Page): Promise<Ctx> {
  const chamadas: Chamada[] = [];
  const modo = { v: "ok" as Ctx["modo"]["v"], semRede: false };
  await page.route("http://t.local/**", async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === "/") return r.fulfill({ contentType: "text/html", body: "<html><body>t</body></html>" });
    if (u.pathname === "/b.js") return r.fulfill({ contentType: "application/javascript", body: bundle });
    if (u.pathname === "/api/ops") {
      if (modo.semRede) return r.abort("internetdisconnected"); // o Playwright atende rotas mesmo "offline"; aqui a queda é de verdade
      chamadas.push(JSON.parse(r.request().postData() ?? "{}"));
      if (modo.v === "500") return r.fulfill({ status: 500, json: { ok: false, erro: "x" } });
      if (modo.v === "401") return r.fulfill({ status: 401, json: { ok: false, erro: "Sessão expirada" } });
      if (modo.v === "422") return r.fulfill({ status: 422, json: { ok: false, erro: "Estoque insuficiente ou valor inválido." } });
      return r.fulfill({ json: { ok: true, resultado: "aplicada" } });
    }
    return r.fulfill({ status: 404, body: "" });
  });
  await page.goto("http://t.local/");
  await page.evaluate(() => { const w = window as never as Record<string, unknown>; w.__uid = "u1"; w.__uploads = []; });
  await page.addScriptTag({ url: "http://t.local/b.js" });
  return { page, chamadas, modo };
}
const executar = (c: Ctx, tipo: string, dados: Record<string, unknown>, bytes?: number[]) =>
  c.page.evaluate(([t, d, b]) => (window as never as { fila: { executar: (...a: unknown[]) => Promise<{ resultado: string; erro?: string }> } }).fila
    .executar(t, d, b ? new Blob([new Uint8Array(b as number[])], { type: "image/jpeg" }) : undefined), [tipo, dados, bytes] as const);
const fila = (c: Ctx) => c.page.evaluate(() => (window as never as { fila: { listar: () => Promise<{ id: string; tipo: string; erro?: string }[]> } }).fila.listar());
const processar = (c: Ctx) => c.page.evaluate(() => (window as never as { fila: { processar: () => Promise<number> } }).fila.processar());
const semRede = async (c: Ctx, v: boolean) => { c.modo.semRede = v; await c.page.evaluate((x) => { (window as never as Record<string, unknown>).__semRede = x; }, v); };
const OS = "11111111-1111-1111-1111-111111111111";

test.describe("fila de saída offline", () => {
  test("online: envia na hora, com id uuid, e a fila fica vazia", async ({ page }) => {
    const c = await abrir(page);
    const r = await executar(c, "status", { os_id: "o1", status: "pronto" });
    expect(r.resultado).toBe("enviada");
    expect(await fila(c)).toHaveLength(0);
    expect(c.chamadas).toHaveLength(1);
    expect(c.chamadas[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("sem sinal: guarda no aparelho, mantém a ordem e sobe sozinho ao voltar", async ({ page }) => {
    const c = await abrir(page);
    await semRede(c, true);
    expect((await executar(c, "item", { os_id: "o1", tipo: "servico", descricao: "Alinhamento", qtd: 1, valor: 80 })).resultado).toBe("fila");
    expect((await executar(c, "status", { os_id: "o1", status: "em_servico" })).resultado).toBe("fila");
    expect(await fila(c)).toHaveLength(2);
    expect(c.chamadas).toHaveLength(0);
    await semRede(c, false);
    expect(await processar(c)).toBe(2);
    expect(await fila(c)).toHaveLength(0);
    expect(c.chamadas.map((x) => x.tipo)).toEqual(["item", "status"]); // um status depende do item lançado antes
  });

  test("erro 500: continua na fila e o reenvio usa o MESMO id (idempotência)", async ({ page }) => {
    const c = await abrir(page);
    c.modo.v = "500";
    expect((await executar(c, "obs", { os_id: "o1", obs: "teste" })).resultado).toBe("fila");
    const id = c.chamadas[0].id;
    c.modo.v = "ok";
    await processar(c);
    expect(c.chamadas).toHaveLength(2);
    expect(c.chamadas[1].id).toBe(id);
    expect(await fila(c)).toHaveLength(0);
  });

  test("sessão vencida (401) não perde a operação", async ({ page }) => {
    const c = await abrir(page);
    c.modo.v = "401";
    expect((await executar(c, "status", { os_id: "o1", status: "pronto" })).resultado).toBe("fila");
    expect(await fila(c)).toHaveLength(1);
    c.modo.v = "ok"; await processar(c);
    expect(await fila(c)).toHaveLength(0);
  });

  test("recusa por regra (422): devolve o motivo, não trava as outras e não é reenviada em loop", async ({ page }) => {
    const c = await abrir(page);
    c.modo.v = "422";
    const r = await executar(c, "item", { os_id: "o1", tipo: "peca", descricao: "X", qtd: 99, valor: 1 });
    expect(r.resultado).toBe("erro"); expect(r.erro).toMatch(/Estoque/);
    c.modo.v = "ok";
    expect((await executar(c, "obs", { os_id: "o1", obs: "ok" })).resultado).toBe("enviada");
    const f = await fila(c);
    expect(f).toHaveLength(1); expect(f[0].erro).toBeTruthy();
    const antes = c.chamadas.length;
    await processar(c);
    expect(c.chamadas.length).toBe(antes);
  });

  test("foto offline: guarda o arquivo, sobe com o caminho os/id.jpg e registra", async ({ page }) => {
    const c = await abrir(page);
    const bytes = Array.from({ length: 2048 }, (_, i) => i % 256);
    await semRede(c, true);
    expect((await executar(c, "foto", { os_id: OS }, bytes)).resultado).toBe("fila");
    expect(await fila(c)).toHaveLength(1);
    await semRede(c, false);
    await processar(c);
    const up = await page.evaluate(() => (window as never as { __uploads: { path: string; size: number }[] }).__uploads);
    const ult = c.chamadas.at(-1)!;
    expect(up).toHaveLength(1);
    expect(up[0].size).toBe(2048);
    expect(up[0].path).toBe(`${OS}/${ult.id}.jpg`);
    expect(ult.tipo).toBe("foto"); expect(ult.dados.caminho).toBe(up[0].path);
    expect(await fila(c)).toHaveLength(0);
  });

  test("upload repetido (já existe) segue para registrar a foto", async ({ page }) => {
    const c = await abrir(page);
    await page.evaluate(() => { (window as never as Record<string, unknown>).__uploadErro = "The resource already exists"; });
    expect((await executar(c, "foto", { os_id: OS }, [1, 2, 3])).resultado).toBe("enviada");
  });

  test("operação de outro usuário espera o dono voltar", async ({ page }) => {
    const c = await abrir(page);
    const uid = (u: string | null) => page.evaluate((x) => { (window as never as Record<string, unknown>).__uid = x; }, u);
    await uid("u2"); await semRede(c, true);
    await executar(c, "obs", { os_id: "o1", obs: "do u2" });
    await semRede(c, false); await uid("u1");
    expect(await processar(c)).toBe(0);
    expect(await fila(c)).toHaveLength(1);
    await uid("u2"); await processar(c);
    expect(await fila(c)).toHaveLength(0);
  });

  test("sem sessão: guarda e espera", async ({ page }) => {
    const c = await abrir(page);
    await page.evaluate(() => { (window as never as Record<string, unknown>).__uid = null; });
    expect((await executar(c, "obs", { os_id: "o1", obs: "x" })).resultado).toBe("fila");
    expect(c.chamadas).toHaveLength(0);
  });
});
