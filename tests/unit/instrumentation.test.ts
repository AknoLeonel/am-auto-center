import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn(async () => ({ error: null }));
let admin: unknown;
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => admin }));
const { onRequestError } = await import("@/instrumentation");

const req = { path: "/painel?q=Maria%20Souza&tel=77999", method: "GET", headers: {} };
const ctx = { routerKind: "App Router", routePath: "/painel", routeType: "render", renderSource: "react-server-components", revalidateReason: undefined } as never;

beforeEach(() => { insert.mockClear(); admin = { from: () => ({ insert }) }; process.env.NEXT_RUNTIME = "nodejs"; vi.spyOn(console, "error").mockImplementation(() => {}); });

describe("registro de erros do servidor", () => {
  it("grava a mensagem real, o digest e a rota", async () => {
    await onRequestError(Object.assign(new Error("function public.listar_os does not exist"), { digest: "1234abcd" }), req, ctx);
    expect(insert).toHaveBeenCalledWith({ digest: "1234abcd", mensagem: "function public.listar_os does not exist", rota: "/painel", tipo: "render", metodo: "GET", caminho: "/painel" });
  });
  it("não guarda a querystring (pode ter nome ou telefone)", async () => {
    await onRequestError(new Error("x"), req, ctx);
    expect(JSON.stringify(insert.mock.calls)).not.toMatch(/Maria|77999/);
  });
  it("corta mensagens enormes", async () => {
    await onRequestError(new Error("x".repeat(2000)), req, ctx);
    expect((insert.mock.calls[0] as unknown as [{ mensagem: string }])[0].mensagem).toHaveLength(500);
  });
  it("aceita erro que não é Error", async () => {
    await onRequestError("texto solto", req, ctx);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ mensagem: "texto solto", digest: null }));
  });
  it("vai para o log mesmo sem a chave de serviço, e não lança erro", async () => {
    admin = null;
    await expect(onRequestError(new Error("boom"), req, ctx)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"mensagem":"boom"'));
  });
  it("falha do banco nunca derruba o app", async () => {
    insert.mockRejectedValueOnce(new Error("db fora"));
    await expect(onRequestError(new Error("boom"), req, ctx)).resolves.toBeUndefined();
  });
  it("fora do runtime Node não tenta falar com o banco", async () => {
    process.env.NEXT_RUNTIME = "edge";
    await onRequestError(new Error("boom"), req, ctx);
    expect(insert).not.toHaveBeenCalled();
  });
});
