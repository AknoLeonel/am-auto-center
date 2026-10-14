import { beforeEach, describe, expect, it, vi } from "vitest";

const enviarPush = vi.fn<(m: { corpo: string; url: string }) => Promise<void>>(async () => {});
const apagados: string[] = [];
let contagens = { lembretes: 0, agendamentos: 0, pedidos_site: 0 };
let admin: unknown;
const consulta = (t: string) => { const b: Record<string, unknown> = {}; for (const m of ["select", "eq", "lte", "gte", "lt"]) b[m] = () => b; b.then = (ok: (v: unknown) => unknown) => ok({ count: contagens[t as keyof typeof contagens] ?? 0, error: null }); return b; };
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => admin }));
vi.mock("@/lib/push", () => ({ enviarPush }));
const { GET } = await import("@/app/api/cron/resumo/route");
const chamar = (auth?: string) => GET(new Request("http://x/api/cron/resumo", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  enviarPush.mockClear(); apagados.length = 0; contagens = { lembretes: 0, agendamentos: 0, pedidos_site: 0 };
  admin = { from: (t: string) => ({ ...consulta(t), delete: () => ({ lt: async () => { apagados.push(t); return {}; } }) }) };
  process.env.CRON_SECRET = "segredo-longo";
});

describe("cron do resumo diário", () => {
  it("sem segredo configurado ou errado: 401", async () => {
    expect((await chamar()).status).toBe(401);
    expect((await chamar("Bearer errado")).status).toBe(401);
    expect((await chamar("Bearer segredo-longo-")).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await chamar("Bearer undefined")).status).toBe(401);
  });
  it("sem chave de serviço: 500 explicando", async () => {
    admin = null;
    const r = await chamar("Bearer segredo-longo"); expect(r.status).toBe(500);
    expect((await r.json()).erro).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
  it("sem nada a avisar: não envia push", async () => {
    const r = await chamar("Bearer segredo-longo");
    expect(await r.json()).toEqual({ ok: true, enviado: false }); expect(enviarPush).not.toHaveBeenCalled();
  });
  it("com pendências: resume com plural certo e aponta a tela mais urgente", async () => {
    contagens = { lembretes: 1, agendamentos: 3, pedidos_site: 2 };
    await chamar("Bearer segredo-longo");
    const msg = enviarPush.mock.calls[0][0];
    expect(msg.corpo).toBe("3 agendamentos hoje · 1 retorno para avisar · 2 pedidos novos do site");
    expect(msg.url).toBe("/painel/agenda");
  });
  it("só um pedido: singular e vai para pedidos", async () => {
    contagens = { lembretes: 0, agendamentos: 0, pedidos_site: 1 };
    await chamar("Bearer segredo-longo");
    const msg = enviarPush.mock.calls[0][0];
    expect(msg.corpo).toBe("1 pedido novo do site"); expect(msg.url).toBe("/painel/pedidos");
  });
  it("faz a limpeza de eventos e erros antigos", async () => {
    await chamar("Bearer segredo-longo");
    expect(apagados).toEqual(expect.arrayContaining(["eventos_site", "erros_app"]));
  });
});
