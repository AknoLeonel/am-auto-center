import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { classificar, diagnosticar, migrationsFaltando } from "@/lib/diagnostico";

const env = { NEXT_PUBLIC_SUPABASE_URL: "u", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k", NEXT_PUBLIC_SITE_URL: "https://amauto.com.br" };

describe("classificar erros do PostgREST/Postgres", () => {
  it.each([
    [null, "ok"],
    [{ code: "PGRST202", message: "Could not find the function public.listar_os in the schema cache" }, "ausente"],
    [{ code: "PGRST205", message: "Could not find the table 'public.pagamentos' in the schema cache" }, "ausente"],
    [{ code: "42P01", message: 'relation "x" does not exist' }, "ausente"],
    [{ code: "42703", message: "column x.token_publico does not exist" }, "ausente"],
    [{ code: "42501", message: "permission denied for table auditoria" }, "ok"],
    [{ code: "P0001", message: "Sem permissão" }, "ok"],
    [{ message: "TypeError: fetch failed" }, "sem-conexao"],
    [{ message: "" }, "ausente"], // erro vazio (resposta sem corpo) não prova que existe
  ])("%j => %s", (erro, esperado) => expect(classificar(erro as never)).toBe(esperado));
});

// Servidor que imita o PostgREST/Storage de um banco que só tem as 6 tabelas originais.
// Usa o cliente REAL do supabase-js: um cliente falso não pegou o bug em que o 404 sem corpo de um HEAD virava "sucesso".
describe("banco antigo (só o esquema original) com o cliente real", () => {
  const existentes = new Set(["clientes", "veiculos", "ordens_servico", "os_itens", "lembretes", "pedidos_site"]);
  const colunasNovas = new Set(["mecanico_id", "garantia_dias", "entregue_em", "peca_id", "custo_unit", "token_publico"]);
  let srv: http.Server; let url = "";

  beforeAll(async () => {
    srv = http.createServer((req, res) => {
      const u = new URL(req.url!, "http://x");
      const json = (st: number, body: unknown) => { res.statusCode = st; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); };
      const vazio = (st: number) => { res.statusCode = st; res.end(); };
      if (u.pathname.startsWith("/rest/v1/rpc/")) return json(404, { code: "PGRST202", message: `Could not find the function public.${u.pathname.split("/").pop()} in the schema cache` });
      if (u.pathname.startsWith("/rest/v1/")) {
        const t = u.pathname.split("/").pop()!;
        if (!existentes.has(t)) return req.method === "HEAD" ? vazio(404) : json(404, { code: "PGRST205", message: `Could not find the table 'public.${t}' in the schema cache` });
        const cols = (u.searchParams.get("select") ?? "*").split(",");
        if (cols.some((c) => colunasNovas.has(c))) return req.method === "HEAD" ? vazio(400) : json(400, { code: "42703", message: `column ${t}.${cols[0]} does not exist` });
        return req.method === "HEAD" ? vazio(200) : json(200, []);
      }
      vazio(404);
    });
    await new Promise<void>((ok) => srv.listen(0, ok));
    url = `http://localhost:${(srv.address() as { port: number }).port}`;
  });
  afterAll(() => { srv.close(); });

  it("aponta o que falta: tabelas, colunas, funções e as 7 migrations", async () => {
    const r = await diagnosticar(createClient(url, "chave", { auth: { persistSession: false } }), { ...env, NEXT_PUBLIC_SITE_URL: undefined });
    const tabelas = r.filter((i) => i.grupo === "Tabelas e visões");
    expect(tabelas.filter((i) => i.ok).map((i) => i.nome).sort()).toEqual([...existentes].sort());
    expect(tabelas.filter((i) => !i.ok)).toHaveLength(tabelas.length - existentes.size);
    expect(r.filter((i) => i.grupo === "Colunas novas").every((i) => !i.ok)).toBe(true);
    expect(r.filter((i) => i.grupo === "Funções do banco").every((i) => !i.ok)).toBe(true);
    expect(migrationsFaltando(r)).toHaveLength(7); // as que criam objetos checáveis (a de segurança não cria nada)
    expect(r.find((i) => i.nome.startsWith("NEXT_PUBLIC_SITE_URL"))?.ok).toBe(false);
    expect(r.find((i) => i.grupo === "Sua conta")?.ok).toBe(false);
  });
});

describe("banco completo", () => {
  const cheio = {
    from: () => ({ select: () => ({ limit: async () => ({ error: null }) }) }),
    rpc: async (f: string) => ({ data: f === "papel_atual" ? "dono" : null, error: null }),
  };
  it("nada obrigatório falta; opcionais ausentes não são erro", async () => {
    const r = await diagnosticar(cheio as never, env);
    expect(r.filter((i) => !i.ok && !i.opcional)).toHaveLength(0);
    expect(r.filter((i) => !i.ok && i.opcional)).toHaveLength(3);
  });
  it("nenhum valor de variável vaza no resultado", async () => {
    const r = await diagnosticar(cheio as never, { ...env, SUPABASE_SERVICE_ROLE_KEY: "SEGREDO-123", CRON_SECRET: "SEGREDO-456", VAPID_PRIVATE_KEY: "SEGREDO-789" });
    expect(JSON.stringify(r)).not.toMatch(/SEGREDO/);
  });
  it("sem rede: orienta a conferir URL e chave", async () => {
    const semRede = { from: () => ({ select: () => ({ limit: async () => ({ error: { message: "TypeError: fetch failed" } }) }) }), rpc: async () => ({ data: null, error: { message: "fetch failed" } }) };
    const r = await diagnosticar(semRede as never, env);
    expect(r.some((i) => /falar com o Supabase/.test(i.detalhe ?? ""))).toBe(true);
  });
});
