// Restaura um backup feito por "npm run db:backup" no MESMO projeto Supabase. Só insere o que falta (não apaga nem sobrescreve).
//   npm run db:restaurar -- backups/2026-10-14_0900 "postgresql://postgres.xxxx:SENHA@host:5432/postgres" --confirmo
import { criarCliente } from "./lib/conexao.mjs";
import { restaurar } from "./lib/backup.mjs";

const args = process.argv.slice(2);
const confirmo = args.includes("--confirmo");
const [pasta, url] = args.filter((a) => a !== "--confirmo");
if (!pasta || !(url || process.env.DATABASE_URL)) {
  console.error('Uso: npm run db:restaurar -- <pasta do backup> "<connection string>" --confirmo');
  process.exit(1);
}
if (!confirmo) {
  console.error(`Isto vai INSERIR no banco os dados que estão em ${pasta} (nada é apagado nem sobrescrito).\nPara continuar, rode de novo acrescentando --confirmo no final.`);
  process.exit(1);
}
const db = criarCliente(url || process.env.DATABASE_URL);
try {
  await db.connect();
  console.log(`Restaurando ${pasta} ...`);
  await restaurar(db, pasta, console.log);
  console.log("\nPronto. Confira o sistema e o /painel/diagnostico.");
} catch (e) {
  console.error(`\nA restauração parou: ${e.message}\nAs tabelas anteriores ficaram restauradas; a tabela com erro foi desfeita.`);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
