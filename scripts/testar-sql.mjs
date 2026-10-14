// Testes do banco: cria um banco descartável, aplica as migrations (duas vezes, para provar que são repetíveis)
// e roda cada arquivo de tests/sql. Cada teste é uma transação desfeita no final.
//   TEST_DATABASE_URL=postgresql://postgres:senha@localhost:5432/postgres npm run test:sql
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

const base = process.env.TEST_DATABASE_URL || "postgresql://postgres@localhost:5432/postgres";
const u = new URL(base);
const NOME = "am_teste_sql";
const cfg = (db) => ({
  host: u.hostname, port: Number(u.port || 5432), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: db,
});
const falhou = (t, e) => {
  console.error(`  ✖ ${t}\n    ${e.message}${e.where ? `\n    em: ${e.where.split("\n")[0]}` : ""}${e.detail ? `\n    ${e.detail}` : ""}`);
};

const admin = new pg.Client(cfg(u.pathname.slice(1) || "postgres"));
admin.on("error", () => {});
await admin.connect();
await admin.query(`drop database if exists ${NOME}`);
await admin.query(`create database ${NOME}`);

const db = new pg.Client(cfg(NOME));
db.on("error", () => {});
await db.connect();
let ok = 0, ruim = 0;
try {
  console.log("Preparando o banco de teste...");
  await db.query(readFileSync("tests/sql/00-stub-supabase.sql", "utf8"));
  const migs = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  for (const passo of ["1ª aplicação", "2ª aplicação (repetível)"]) {
    for (const m of migs) {
      try { await db.query(readFileSync(join("supabase/migrations", m), "utf8")); }
      catch (e) { falhou(`${passo}: ${m}`, e); ruim++; throw e; }
    }
    console.log(`  ✔ ${migs.length} migrations, ${passo}`);
    ok++;
  }
  console.log("\nTestes:");
  const alvo = `postgresql://${encodeURIComponent(decodeURIComponent(u.username))}${u.password ? ":" + u.password : ""}@${u.hostname}:${u.port || 5432}/${NOME}`;
  for (const f of readdirSync("tests/sql").filter((x) => /\.test\.(sql|mjs)$/.test(x)).sort()) {
    try {
      if (f.endsWith(".sql")) await db.query(readFileSync(join("tests/sql", f), "utf8"));
      else await (await import(pathToFileURL(resolve("tests/sql", f)).href)).default(db, { url: alvo });
      console.log(`  ✔ ${f}`); ok++;
    } catch (e) { falhou(f, e); ruim++; await db.query("rollback").catch(() => {}); await db.query("reset role").catch(() => {}); }
  }
} catch { /* já reportado */ }
finally {
  await db.end().catch(() => {});
  await admin.query(`drop database if exists ${NOME}`).catch(() => {});
  await admin.end().catch(() => {});
}
console.log(ruim ? `\n${ruim} FALHA(S)` : `\nTODOS OS TESTES DO BANCO PASSARAM (${ok})`);
process.exit(ruim ? 1 : 0);
