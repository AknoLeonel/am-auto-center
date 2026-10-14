import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
let claims: unknown = { sub: "u1" };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: claims ? { claims } : null }) }, rpc }),
}));
const { POST } = await import("@/app/api/ops/route");

const OS = "11111111-1111-4111-8111-111111111111";
const chamar = (corpo: unknown) => POST(new Request("http://x/api/ops", { method: "POST", body: typeof corpo === "string" ? corpo : JSON.stringify(corpo) }));
const op = (tipo: string, dados: Record<string, unknown>) => ({ id: crypto.randomUUID(), tipo, dados });

beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ data: "aplicada", error: null }); claims = { sub: "u1" }; });

describe("POST /api/ops (fila offline)", () => {
  it("sem sessão: 401 e nada é executado", async () => {
    claims = null;
    expect((await chamar(op("obs", { os_id: OS, obs: "x" }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("corpo inválido: 400", async () => {
    expect((await chamar("não é json")).status).toBe(400);
    expect((await chamar({ id: "x", tipo: "obs", dados: {} })).status).toBe(400);
    expect((await chamar({ ...op("apagar", {}) })).status).toBe(400);
  });
  it("dados inválidos por tipo: 422 e mensagem", async () => {
    expect((await chamar(op("status", { os_id: OS, status: "voando" }))).status).toBe(422);
    expect((await chamar(op("item", { os_id: OS, tipo: "servico", descricao: "", qtd: 1, valor: 10 }))).status).toBe(422);
    expect((await chamar(op("item", { os_id: OS, tipo: "peca", descricao: "x", qtd: -1, valor: 10 }))).status).toBe(422);
    expect((await chamar(op("foto", { os_id: OS, caminho: "../../etc/passwd" }))).status).toBe(422);
    expect((await chamar(op("obs", { os_id: OS, obs: "x".repeat(2001) }))).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("foto só no caminho os/uuid.jpg", async () => {
    expect((await chamar(op("foto", { os_id: OS, caminho: `${OS}/${crypto.randomUUID()}.jpg` }))).status).toBe(200);
    expect((await chamar(op("foto", { os_id: OS, caminho: `${OS}/x.png` }))).status).toBe(422);
  });
  it("sucesso: chama aplicar_op com o id da operação (idempotência)", async () => {
    const o = op("status", { os_id: OS, status: "pronto" });
    const r = await chamar(o);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, resultado: "aplicada" });
    expect(rpc).toHaveBeenCalledWith("aplicar_op", { p_id: o.id, p_tipo: "status", p_dados: { os_id: OS, status: "pronto" } });
  });
  it("reenvio duplicado devolve 200", async () => {
    rpc.mockResolvedValue({ data: "duplicada", error: null });
    const r = await chamar(op("obs", { os_id: OS, obs: "x" }));
    expect(r.status).toBe(200); expect((await r.json()).resultado).toBe("duplicada");
  });
  it.each([["42501", 403], ["23514", 422], ["P0002", 422], ["22023", 422], ["XX000", 500]])("erro do banco %s vira HTTP %i", async (code, http) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: "boom" } });
    const r = await chamar(op("obs", { os_id: OS, obs: "x" }));
    expect(r.status).toBe(http);
    expect((await r.json()).ok).toBe(false);
  });
});
