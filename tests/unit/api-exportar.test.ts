import { beforeEach, describe, expect, it, vi } from "vitest";

let papel: string | null = "dono";
let linhas: Record<string, unknown>[] = [];
const filtros: [string, ...unknown[]][] = [];
const builder = () => {
  const b: Record<string, unknown> = {};
  for (const m of ["select", "gte", "lt", "order", "limit", "eq"]) b[m] = (...a: unknown[]) => { filtros.push([m, ...a]); return b; };
  b.then = (ok: (v: unknown) => unknown) => ok({ data: linhas, error: null });
  return b;
};
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => builder() }) }));
vi.mock("@/lib/papel", () => ({ papelAtual: async () => papel, ehGestao: (p: string | null) => p === "dono" || p === "atendente" }));
const { GET } = await import("@/app/painel/relatorios/exportar/route");

const baixar = (qs: string) => GET(new Request(`http://x/painel/relatorios/exportar?${qs}`));
beforeEach(() => { papel = "dono"; linhas = []; filtros.length = 0; });

describe("exportação CSV", () => {
  it("mecânico: 403", async () => { papel = "mecanico"; expect((await baixar("tipo=os&ini=2026-10-01&fim=2026-10-31")).status).toBe(403); });
  it("sem papel: 403", async () => { papel = null; expect((await baixar("tipo=os&ini=2026-10-01&fim=2026-10-31")).status).toBe(403); });
  it("período inválido ou invertido: 400", async () => {
    expect((await baixar("tipo=os&ini=abc&fim=2026-10-31")).status).toBe(400);
    expect((await baixar("tipo=os&ini=2026-10-31&fim=2026-10-01")).status).toBe(400);
  });
  it("tipo desconhecido: 400", async () => expect((await baixar("tipo=senhas&ini=2026-10-01&fim=2026-10-31")).status).toBe(400));
  it("OS: BOM, separador ;, vírgula decimal, datas da Bahia, nome de arquivo", async () => {
    linhas = [{ numero: 7, placa: "ABC1D23", modelo: "Gol", cliente_nome: "João", cliente_telefone: "77999", status: "entregue", criado_em: "2026-10-11T12:30:00Z", entregue_em: null, total: 1500.5, custo: 40, pago: 100, saldo: 1400.5 }];
    const r = await baixar("tipo=os&ini=2026-10-01&fim=2026-10-31");
    const bytes = new Uint8Array(await r.clone().arrayBuffer());
    const t = await r.text(); // o text() descarta o BOM; por isso ele é conferido nos bytes
    expect(r.headers.get("content-type")).toContain("text/csv");
    expect(r.headers.get("content-disposition")).toContain("am-os-2026-10-01_a_2026-10-31.csv");
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8: o Excel abre com acentos certos
    const [cab, l1] = t.trim().split("\r\n");
    expect(cab.split(";")).toHaveLength(12);
    expect(l1).toContain('"1500,50"'); expect(l1).toContain('"1400,50"');
    expect(l1).toContain("11/10/2026, 09:30"); // 12:30 UTC = 09:30 na Bahia
  });
  it("período filtra pelo dia inteiro da Bahia (UTC-3)", async () => {
    await baixar("tipo=os&ini=2026-10-01&fim=2026-10-31");
    expect(filtros).toContainEqual(["gte", "criado_em", "2026-10-01T03:00:00.000Z"]);
    expect(filtros).toContainEqual(["lt", "criado_em", "2026-11-01T03:00:00.000Z"]);
  });
  it("neutraliza injeção de fórmula do Excel e aspas", async () => {
    linhas = [{ numero: 1, placa: "=HYPERLINK(\"http://evil\")", modelo: "+cmd", cliente_nome: "-1+1", cliente_telefone: "@x", status: "a\"b", criado_em: null, entregue_em: null, total: 0, custo: 0, pago: 0, saldo: 0 }];
    const l = (await (await baixar("tipo=os&ini=2026-10-01&fim=2026-10-31")).text()).trim().split("\r\n")[1];
    expect(l).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(l).toContain(`"'+cmd"`); expect(l).toContain(`"'-1+1"`); expect(l).toContain(`"'@x"`);
    expect(l).toContain('"a""b"');
  });
  it("estoque calcula o valor a custo", async () => {
    linhas = [{ nome: "Pastilha", codigo: null, qtd: 3, minimo: 1, custo: 40, preco: 90 }];
    expect((await (await baixar("tipo=estoque&ini=2026-10-01&fim=2026-10-31")).text())).toContain('"120,00"');
  });
});
