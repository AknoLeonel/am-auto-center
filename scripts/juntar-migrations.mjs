// Junta todas as migrations num único arquivo para colar de uma vez no SQL Editor do Supabase.
// Uso: npm run db:setup   (o CI confere que supabase/setup-completo.sql está em dia)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const arquivos = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const corpo = arquivos.map((f) => `-- ===== ${f} =====\n${readFileSync(join(dir, f), "utf8").trim()}\n`).join("\n");
const cab = `-- AM Auto Center: instalação completa do banco (gerado por "npm run db:setup", não edite à mão).
-- Cole tudo no SQL Editor do Supabase e clique em Run. É seguro rodar de novo: nada é apagado.
-- Antes de rodar: crie o seu usuário em Authentication > Users (ele vira o DONO).
-- Migrations incluídas: ${arquivos.join(", ")}\n\n`;
writeFileSync("supabase/setup-completo.sql", cab + corpo);
console.log(`supabase/setup-completo.sql gerado com ${arquivos.length} migrations.`);
