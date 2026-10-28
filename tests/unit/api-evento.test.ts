import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn<(fn: string, args: Record<string, unknown>) => Promise<{ data: string; error: null }>>(async () => ({ data: "ok", error: null }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: insert }) }));
const { POST } = await import("@/app/api/evento/route");

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const enviar = (corpo: unknown, h: Record<string, string> = {}) =>
  POST(new Request("https://site.com.br/api/evento", { method: "POST", body: typeof corpo === "string" ? corpo : JSON.stringify(corpo), headers: { "user-agent": UA, ...h } }));
const ok = { evento: "whatsapp", origem: "hero", pagina: "/", dispositivo: "mobile" };

beforeEach(() => insert.mockClear());

describe("POST /api/evento (conversões do site)", () => {
  it("sempre 204, mesmo com lixo (não revela nada a quem mede)", async () => {
    for (const c of ["lixo", "{}", { evento: "hack", pagina: "/" }, null, 42]) expect((await enviar(c as never)).status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
  });
  it("grava um evento válido, com campos vazios como nulo", async () => {
    const r = await enviar({ ...ok, fonte: "", meio: "bio", ref: "  " });
    expect(r.status).toBe(204);
    expect(insert).toHaveBeenCalledWith("registrar_evento", {
      p_evento: "whatsapp", p_origem: "hero", p_pagina: "/", p_fonte: null, p_meio: "bio", p_campanha: null, p_ref: null,
      p_dispositivo: "mobile", p_visitante: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
  });
  it("o resumo do aparelho muda com o IP e não guarda o IP", async () => {
    await enviar(ok, { "x-forwarded-for": "1.2.3.4" }); await enviar(ok, { "x-forwarded-for": "5.6.7.8" });
    const [a, b] = insert.mock.calls.map((c) => String(c[1].p_visitante));
    expect(a).not.toBe(b);
    expect(a).not.toContain("1.2.3.4");
  });
  it("página precisa começar com / e ter até 120 caracteres", async () => {
    await enviar({ ...ok, pagina: "http://evil.com" }); await enviar({ ...ok, pagina: "/" + "a".repeat(130) });
    expect(insert).not.toHaveBeenCalled();
  });
  it("campos longos demais são recusados", async () => { await enviar({ ...ok, origem: "x".repeat(61) }); expect(insert).not.toHaveBeenCalled(); });
  it.each(["Googlebot/2.1", "Mozilla/5.0 Chrome-Lighthouse", "HeadlessChrome/120", "facebookexternalhit/1.1", "Pingdom monitor"])("ignora robô: %s", async (ua) => {
    await enviar(ok, { "user-agent": ua }); expect(insert).not.toHaveBeenCalled();
  });
  it("ignora requisição vinda de outro site (Origin diferente)", async () => {
    await enviar(ok, { origin: "https://evil.com" }); expect(insert).not.toHaveBeenCalled();
    await enviar(ok, { origin: "https://site.com.br" }); expect(insert).toHaveBeenCalledTimes(1);
  });
  it("falha do banco não vira erro para o visitante", async () => {
    insert.mockRejectedValueOnce(new Error("db fora"));
    expect((await enviar(ok)).status).toBe(204);
  });
});
