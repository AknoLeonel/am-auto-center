// Faz o backup dos dados do app direto do seu computador.
//   npm run db:backup -- "postgresql://postgres.xxxx:SENHA@host:5432/postgres"
// Cria a pasta backups/AAAA-MM-DD_HHMM com um arquivo por tabela. Guarde em local seguro: tem dados dos clientes.
import { criarCliente } from "./lib/conexao.mjs";
import { fazerBackup, pastaDeBackup } from "./lib/backup.mjs";

const db = criarCliente(process.argv[2] || process.env.DATABASE_URL);
try {
  await db.connect();
  const pasta = pastaDeBackup();
  console.log(`Fazendo backup em ${pasta} ...`);
  const m = await fazerBackup(db, pasta, console.log);
  const total = Object.values(m.tabelas).reduce((a, b) => a + b, 0);
  console.log(`\nPronto: ${Object.keys(m.tabelas).length} tabelas, ${total} linhas.\nNão inclui: usuários de login, senhas e as fotos (Storage). Guarde esta pasta em local seguro.`);
} catch (e) {
  console.error(`Não consegui fazer o backup: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
