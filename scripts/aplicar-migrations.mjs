// Aplica as migrations do Supabase direto do seu computador, sem copiar e colar SQL.
//   1) No Supabase, clique em "Connect" (topo da página) > "Session pooler" e copie a "Connection string".
//      Troque [YOUR-PASSWORD] pela senha do banco (Project Settings > Database > Reset database password, se não lembrar).
//   2) No terminal do VS Code, dentro da pasta do projeto:
//        npm install
//        npm run db:aplicar -- "postgresql://postgres.xxxx:SUASENHA@aws-0-regiao.pooler.supabase.com:5432/postgres"
// É seguro rodar quantas vezes quiser: as migrations só criam o que falta e nunca apagam dados.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('Faltou a connection string.\nUso: npm run db:aplicar -- "postgresql://postgres.xxxx:SENHA@host:5432/postgres"\n(Supabase > botão Connect > Session pooler)');
  process.exit(1);
}

let u;
try { u = new URL(url); } catch { console.error("A connection string parece inválida. Confira se copiou inteira e se trocou [YOUR-PASSWORD] pela senha."); process.exit(1); }
if (u.password === "[YOUR-PASSWORD]" || /^\[.*\]$/.test(decodeURIComponent(u.password))) {
  console.error("Você esqueceu de trocar [YOUR-PASSWORD] pela senha do banco."); process.exit(1);
}
const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
const client = new pg.Client({
  host: u.hostname, port: Number(u.port || 5432), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.slice(1) || "postgres"),
  ssl: local ? false : { rejectUnauthorized: false }, // o Supabase exige conexão segura
});

const dir = "supabase/migrations";
const arquivos = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
let aplicadas = 0;
try {
  await client.connect();
  console.log(`Conectado a ${u.hostname} como ${decodeURIComponent(u.username)}. Aplicando ${arquivos.length} migrations...\n`);
  for (const f of arquivos) {
    try {
      // Um único comando com vários SQLs roda como uma transação: se algo falhar, este arquivo inteiro é desfeito.
      await client.query(readFileSync(join(dir, f), "utf8"));
      console.log(`  ✔ ${f}`);
      aplicadas++;
    } catch (e) {
      console.error(`  ✖ ${f}\n    ${e.message}${e.position ? ` (posição ${e.position})` : ""}\n`);
      console.error("Parei aqui. Este arquivo foi desfeito por inteiro; os anteriores ficaram aplicados. Me envie esta mensagem.");
      process.exitCode = 1;
      break;
    }
  }
  if (!process.exitCode) await client.query("notify pgrst, 'reload schema'"); // avisa a API para enxergar as tabelas novas
} catch (e) {
  console.error(`Não consegui conectar: ${e.message}\nConfira a connection string (use a "Session pooler") e a senha.`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
if (!process.exitCode) console.log(`\nPronto: ${aplicadas} migrations aplicadas. Agora abra /painel/diagnostico no site para conferir.`);
