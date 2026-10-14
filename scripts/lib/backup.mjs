// Backup e restauração dos dados do app (esquema public) em arquivos NDJSON, uma tabela por arquivo.
// O backup NÃO inclui: usuários (auth), fotos (Storage) nem senhas. Restaure no MESMO projeto Supabase.
import { createReadStream, createWriteStream, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createGunzip, createGzip } from "node:zlib";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// Tabelas que são do aparelho/sessão e não fazem sentido restaurar
const NAO_RESTAURAR = new Set(["fila_ops", "push_subs"]);
const aspas = (t) => `public."${t.replaceAll('"', '""')}"`;

async function tabelas(db) {
  const { rows } = await db.query(`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`);
  return rows.map((r) => r.table_name);
}

// Ordem que respeita as chaves estrangeiras (pai antes de filho). Ligações para fora do esquema public são ignoradas.
async function ordenar(db, lista) {
  const { rows } = await db.query(`
    select c.conrelid::regclass::text as filho, c.confrelid::regclass::text as pai
    from pg_constraint c join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public'`);
  const limpa = (s) => s.replace(/^public\./, "").replaceAll('"', "");
  const deps = new Map(lista.map((t) => [t, new Set()]));
  for (const { filho, pai } of rows) {
    const f = limpa(filho), p = limpa(pai);
    if (f !== p && deps.has(f) && deps.has(p)) deps.get(f).add(p);
  }
  const feitos = [], faltam = new Set(lista);
  while (faltam.size) {
    const prontos = [...faltam].filter((t) => [...deps.get(t)].every((d) => !faltam.has(d)));
    if (!prontos.length) throw new Error(`Dependência circular entre tabelas: ${[...faltam].join(", ")}`);
    for (const t of prontos.sort()) { feitos.push(t); faltam.delete(t); }
  }
  return feitos;
}

export async function fazerBackup(db, pasta, log = () => {}) {
  mkdirSync(pasta, { recursive: true });
  const manifesto = { criado_em: new Date().toISOString(), versao: 1, tabelas: {} };
  for (const t of await tabelas(db)) {
    // ::text mantém os números exatamente como o banco os guarda (40.50 continua 40.50; valores grandes não perdem precisão).
    const { rows } = await db.query(`select to_jsonb(t)::text as r from ${aspas(t)} t`);
    const saida = createWriteStream(join(pasta, `${t}.ndjson.gz`));
    await pipeline(Readable.from(rows.map((x) => x.r + "\n")), createGzip(), saida);
    manifesto.tabelas[t] = rows.length;
    log(`  ✔ ${t}: ${rows.length} linhas`);
  }
  writeFileSync(join(pasta, "manifesto.json"), JSON.stringify(manifesto, null, 2));
  return manifesto;
}

async function lerLinhas(arquivo) {
  const linhas = [];
  const rl = createInterface({ input: createReadStream(arquivo).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const l of rl) if (l.trim()) linhas.push(l); // texto cru: não passa por números do JavaScript
  return linhas;
}

export async function restaurar(db, pasta, log = () => {}) {
  const manifesto = JSON.parse(readFileSync(join(pasta, "manifesto.json"), "utf8"));
  const existentes = new Set(await tabelas(db));
  const ordem = (await ordenar(db, [...existentes])).filter((t) => t in manifesto.tabelas && !NAO_RESTAURAR.has(t));
  const resultado = {};
  // Gatilhos de usuário (auditoria, baixa de estoque, histórico) ficam desligados durante a carga: os dados já são o resultado deles.
  // As chaves estrangeiras continuam valendo. Só o dono da tabela precisa dessa permissão (não exige superusuário).
  for (const t of ordem) await db.query(`alter table ${aspas(t)} disable trigger user`);
  try {
    for (const t of ordem) {
      const linhas = await lerLinhas(join(pasta, `${t}.ndjson.gz`));
      if (linhas.length !== manifesto.tabelas[t]) throw new Error(`${t}: o arquivo tem ${linhas.length} linhas e o manifesto diz ${manifesto.tabelas[t]} (backup incompleto).`);
      await db.query("begin");
      try {
        let novas = 0;
        for (let i = 0; i < linhas.length; i += 500) {
          const r = await db.query(
            `insert into ${aspas(t)} overriding system value select * from jsonb_populate_recordset(null::${aspas(t)}, $1::jsonb) on conflict do nothing`,
            [`[${linhas.slice(i, i + 500).join(",")}]`],
          );
          novas += r.rowCount;
        }
        await db.query("commit");
        resultado[t] = { no_backup: linhas.length, inseridas: novas, ja_existiam: linhas.length - novas };
        log(`  ✔ ${t}: ${novas} inseridas${linhas.length - novas ? `, ${linhas.length - novas} já existiam` : ""}`);
      } catch (e) { await db.query("rollback"); throw new Error(`${t}: ${e.message}`); }
    }
    // As sequências (nº da OS etc.) precisam passar do maior valor restaurado, senão a próxima OS repetiria um número
    const { rows: ids } = await db.query(`select table_name t, column_name c from information_schema.columns where table_schema = 'public' and is_identity = 'YES'`);
    for (const { t, c } of ids) {
      await db.query(`select setval(pg_get_serial_sequence('${aspas(t)}', '${c}'), greatest((select coalesce(max("${c}"), 0) from ${aspas(t)}), 1), (select count(*) > 0 from ${aspas(t)}))`);
    }
  } finally {
    for (const t of ordem) await db.query(`alter table ${aspas(t)} enable trigger user`);
  }
  return resultado;
}

export const pastaDeBackup = (base = "backups") => {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  return join(base, `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`);
};
export const listarBackups = (base = "backups") => { try { return readdirSync(base).sort(); } catch { return []; } };
