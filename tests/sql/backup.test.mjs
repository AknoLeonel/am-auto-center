// Backup e restauração de ponta a ponta: cria dados, faz o backup, APAGA tudo, restaura e compara cada tabela.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { createGunzip, createGzip } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { fazerBackup, restaurar } from "../../scripts/lib/backup.mjs";

const NAO = new Set(["fila_ops", "push_subs"]);

async function impressao(db) {
  const { rows: ts } = await db.query(`select table_name t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`);
  const out = {};
  for (const { t } of ts) {
    if (NAO.has(t)) continue;
    const { rows } = await db.query(`select count(*)::int n, coalesce(md5(string_agg(to_jsonb(x)::text, '|' order by to_jsonb(x)::text)), '') h from public."${t}" x`);
    out[t] = rows[0];
  }
  return out;
}

export default async function testeBackup(db, { url }) {
  const dir = mkdtempSync(join(tmpdir(), "backup-"));
  try {
    // ---- dados de verdade, criados pelas próprias funções do app (com os gatilhos funcionando)
    const { rows: [{ id: dono }] } = await db.query(`select user_id id from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com'`);
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [dono]);
    await db.query(`set role authenticated`);
    const { rows: [{ id: os1 }] } = await db.query(`select criar_os('ABC1D23','João "Zé" Silva','77999642878','carro','Gol',2015,85000,'barulho no freio; urgente') id`);
    await db.query(`select criar_os('QWE4R56','Maria Souza',null,'moto','CG 160',2020,12000,null)`);
    const { rows: [{ id: peca }] } = await db.query(`insert into pecas_estoque(nome,codigo,qtd,minimo,custo,preco) values ('Pastilha','P-1',10,2,40.50,89.90) returning id`);
    await db.query(`insert into os_itens(os_id,tipo,descricao,qtd,valor_unit,peca_id) values ($1,'peca','Pastilha',2,89.90,$2)`, [os1, peca]);
    await db.query(`insert into os_itens(os_id,tipo,descricao,qtd,valor_unit) values ($1,'servico','Mão de obra',1,80)`, [os1]);
    await db.query(`update ordens_servico set status = 'pronto', garantia_dias = 120 where id = $1`, [os1]);
    await db.query(`insert into pagamentos(os_id,valor,forma,obs) values ($1,100,'pix','sinal')`, [os1]);
    await db.query(`select salvar_checklist($1,'entrada',array['Documentos do veículo'])`, [os1]);
    await db.query(`select criar_orcamento($1)`, [os1]);
    await db.query(`insert into lembretes(cliente_id,veiculo_id,os_id,motivo,data_aviso) select cliente_id,veiculo_id,id,'Troca de óleo','2027-03-01' from ordens_servico where id = $1`, [os1]);
    await db.query(`insert into agendamentos(inicio,descricao,nome) values ('2026-12-01T12:00:00Z','Revisão','Carlos')`);
    await db.query(`insert into os_fotos(os_id,caminho) values ($1,$2)`, [os1, `${os1}/a.jpg`]);
    await db.query(`reset role`);
    await db.query(`insert into eventos_site(evento,origem,pagina,dispositivo) values ('whatsapp','hero','/','mobile')`);
    await db.query(`insert into pedidos_site(tipo,nome,mensagem) values ('guincho','Ana','Preciso de guincho, urgente!')`);
    await db.query(`insert into erros_app(mensagem) values ('erro de teste')`);

    const antes = await impressao(db);
    const maxNumero = (await db.query(`select max(numero)::int m from ordens_servico`)).rows[0].m;
    const estoqueAntes = (await db.query(`select qtd::float q from pecas_estoque`)).rows[0].q;
    assert.equal(estoqueAntes, 8, "pré-condição: a baixa de estoque aconteceu na criação");

    // ---- backup
    const m = await fazerBackup(db, dir);
    for (const [t, n] of Object.entries(m.tabelas)) assert.equal(n, antes[t]?.n ?? n, `manifesto de ${t}`);
    assert.ok(readdirSync(dir).includes("clientes.ndjson.gz") && readdirSync(dir).includes("manifesto.json"), "um arquivo por tabela + manifesto");

    // ---- apaga TUDO (como num desastre) e restaura
    const { rows: ts } = await db.query(`select table_name t from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'`);
    await db.query(`truncate ${ts.map((x) => `public."${x.t}"`).join(", ")} cascade`);
    assert.equal((await db.query(`select count(*)::int n from clientes`)).rows[0].n, 0, "banco vazio antes de restaurar");

    const r1 = await restaurar(db, dir);
    const depois = await impressao(db);
    assert.deepEqual(depois, antes, "cada tabela volta idêntica (mesma contagem e mesmo hash das linhas)");
    assert.equal((await db.query(`select qtd::float q from pecas_estoque`)).rows[0].q, 8, "o estoque NÃO é descontado de novo na restauração");
    assert.equal((await db.query(`select count(*)::int n from auditoria`)).rows[0].n, antes.auditoria.n, "a auditoria não ganha registros falsos da restauração");
    assert.ok(Object.values(r1).every((x) => x.ja_existiam === 0), "nada já existia");

    // ---- efeitos colaterais perigosos
    await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [dono]);
    await db.query(`set role authenticated`);
    const { rows: [{ id: os3 }] } = await db.query(`select criar_os('ZZZ9Z99','Novo','77988887777','carro','Uno',2010,1,'x') id`);
    const { numero } = (await db.query(`select numero::int from ordens_servico where id = $1`, [os3])).rows[0];
    assert.ok(numero > maxNumero, `o número da próxima OS (${numero}) passa do maior restaurado (${maxNumero}): sem repetir`);
    await db.query(`insert into os_itens(os_id,tipo,descricao,qtd,valor_unit,peca_id) values ($1,'peca','Pastilha',1,89.90,$2)`, [os3, peca]);
    await db.query(`reset role`);
    assert.equal((await db.query(`select qtd::float q from pecas_estoque`)).rows[0].q, 7, "os gatilhos voltaram a funcionar (baixa de estoque)");
    assert.ok((await db.query(`select count(*)::int n from auditoria`)).rows[0].n > antes.auditoria.n, "e a auditoria também");
    await db.query(`delete from os_itens where os_id = $1`, [os3]);
    await db.query(`delete from ordens_servico where id = $1`, [os3]);
    await db.query(`delete from clientes where nome = 'Novo'`); // o veículo vai junto (cascata)

    // ---- restaurar de novo não duplica
    const r2 = await restaurar(db, dir);
    assert.ok(Object.values(r2).every((x) => x.inseridas === 0), "na segunda restauração tudo já existe: nada é inserido de novo");
    assert.equal((await db.query(`select count(*)::int n from clientes`)).rows[0].n, antes.clientes.n, "restaurar duas vezes não duplica clientes");
    assert.equal((await db.query(`select count(*)::int n from os_itens`)).rows[0].n, antes.os_itens.n, "nem itens");

    // ---- backup incompleto é recusado
    const arq = join(dir, "clientes.ndjson.gz");
    const texto = await new Promise((ok, no) => { const p = []; createReadStream(arq).pipe(createGunzip()).on("data", (d) => p.push(d)).on("end", () => ok(Buffer.concat(p).toString())).on("error", no); });
    const cortado = texto.split("\n").filter(Boolean).slice(0, 1).join("\n") + "\n";
    await pipeline((async function* () { yield cortado; })(), createGzip(), createWriteStream(arq));
    await db.query(`truncate public.ordens_servico, public.clientes cascade`);
    await assert.rejects(() => restaurar(db, dir), /backup incompleto/, "arquivo com menos linhas que o manifesto é recusado");

    // ---- a linha de comando exige confirmação
    const sem = spawnSync("node", ["scripts/restaurar-banco.mjs", dir, url], { encoding: "utf8" });
    assert.equal(sem.status, 1, "sem --confirmo, não restaura");
    assert.match(sem.stderr, /--confirmo/, "e explica o que fazer");
    const semArgs = spawnSync("node", ["scripts/restaurar-banco.mjs"], { encoding: "utf8" });
    assert.equal(semArgs.status, 1);
  } finally {
    await db.query(`reset role`).catch(() => {});
    rmSync(dir, { recursive: true, force: true });
  }
}
