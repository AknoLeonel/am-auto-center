import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { createECDH, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import webpush from "web-push";

// Serviço de push e PostgREST simulados. O web-push sempre usa HTTPS, então o endpoint precisa de TLS (certificado de teste).
const dir = mkdtempSync(join(tmpdir(), "push-"));
let openssl = true;
try { execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${dir}/k.pem -out ${dir}/c.pem -days 1 -subj "/CN=localhost"`, { stdio: "ignore" }); } catch { openssl = false; }

const recebidos: { path: string; headers: http.IncomingHttpHeaders; bytes: number }[] = [];
const deletes: string[] = [];
const consultas: string[] = [];
const chave = () => { const e = createECDH("prime256v1"); e.generateKeys(); return { p256dh: e.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") }; };
let rest: http.Server; let push: https.Server; let pushPort = 0;
const antes = { ...process.env };

beforeAll(async () => {
  if (!openssl) return;
  const k1 = chave(), k2 = chave();
  rest = http.createServer((req, res) => {
    const u = new URL(req.url!, "http://x");
    res.setHeader("content-type", "application/json");
    if (u.pathname.startsWith("/rest/v1/perfis")) { consultas.push(decodeURIComponent(u.search)); return res.end(JSON.stringify([{ user_id: "u-dono" }, { user_id: "u-aten" }])); }
    if (u.pathname.startsWith("/rest/v1/push_subs") && req.method === "GET")
      return res.end(JSON.stringify([{ user_id: "u-dono", endpoint: `https://localhost:${pushPort}/push/ok`, ...k1 }, { user_id: "u-aten", endpoint: `https://localhost:${pushPort}/push/gone`, ...k2 }]));
    if (u.pathname.startsWith("/rest/v1/push_subs") && req.method === "DELETE") { deletes.push(decodeURIComponent(u.search)); res.statusCode = 204; return res.end(); }
    res.statusCode = 404; res.end();
  });
  push = https.createServer({ key: readFileSync(`${dir}/k.pem`), cert: readFileSync(`${dir}/c.pem`) }, (req, res) => {
    const c: Buffer[] = []; req.on("data", (d) => c.push(d));
    req.on("end", () => { recebidos.push({ path: req.url!, headers: req.headers, bytes: Buffer.concat(c).length }); res.statusCode = req.url === "/push/gone" ? 410 : 201; res.end(); });
  });
  await new Promise<void>((ok) => rest.listen(0, ok)); await new Promise<void>((ok) => push.listen(0, ok));
  pushPort = (push.address() as { port: number }).port;
  const v = webpush.generateVAPIDKeys();
  Object.assign(process.env, {
    NODE_TLS_REJECT_UNAUTHORIZED: "0", NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${(rest.address() as { port: number }).port}`,
    SUPABASE_SERVICE_ROLE_KEY: "service", NEXT_PUBLIC_VAPID_PUBLIC_KEY: v.publicKey, VAPID_PRIVATE_KEY: v.privateKey, VAPID_SUBJECT: "mailto:teste@example.com",
  });
});
afterAll(() => { rest?.close(); push?.close(); rmSync(dir, { recursive: true, force: true }); process.env = antes; });

describe.skipIf(!openssl)("envio de push", () => {
  it("só dono/atendente ativos recebem, criptografado e assinado; aparelho que devolve 410 é removido", async () => {
    const { enviarPush } = await import("@/lib/push");
    await enviarPush({ titulo: "Novo pedido do site", corpo: "Peças · João", url: "/painel/pedidos" });
    expect(consultas[0]).toContain("ativo=eq.true"); expect(consultas[0]).toContain("papel=in.(dono,atendente)");
    expect(recebidos).toHaveLength(2);
    const ok = recebidos.find((r) => r.path === "/push/ok")!;
    expect(ok.headers["content-encoding"]).toBe("aes128gcm");
    expect(ok.bytes).toBeGreaterThan(0);
    expect(String(ok.headers.authorization)).toMatch(/^vapid /);
    expect(ok.headers.ttl).toBe("3600");
    expect(deletes).toHaveLength(1); expect(deletes[0]).toContain("/push/gone"); expect(deletes[0]).toContain("u-aten");
  });
  it("sem as chaves VAPID: não envia e não lança erro", async () => {
    const { enviarPush } = await import("@/lib/push");
    recebidos.length = 0; const k = process.env.VAPID_PRIVATE_KEY; delete process.env.VAPID_PRIVATE_KEY;
    await expect(enviarPush({ titulo: "x", corpo: "y", url: "/painel" })).resolves.toBeUndefined();
    expect(recebidos).toHaveLength(0); process.env.VAPID_PRIVATE_KEY = k;
  });
});
