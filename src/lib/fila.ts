// Fila de saída offline ("outbox"): toda alteração feita na oficina é gravada primeiro no aparelho (IndexedDB)
// e só depois enviada. Sem sinal, fica guardada e sobe sozinha quando a rede volta.
// Cada operação tem um id próprio; o servidor ignora reenvios do mesmo id (veja aplicar_op no banco).
import { createClient } from "@/lib/supabase/client";

export type TipoOp = "status" | "obs" | "item" | "foto";
export type Op = {
  id: string; tipo: TipoOp; dados: Record<string, unknown>; blob?: Blob;
  userId: string | null; criadoEm: number; erro?: string;
};
export type Resultado = { resultado: "enviada" | "fila" | "erro"; erro?: string };

const DB = "am-fila";
const STORE = "ops";
export const EVENTO = "am-fila";

// ---- armazenamento (IndexedDB, com memória como plano B quando o navegador bloqueia) ----
const memoria = new Map<string, Op>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function abrir(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((ok) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => ok(req.result);
      req.onerror = () => ok(null);
    } catch { ok(null); }
  });
  return dbPromise;
}

async function pedir<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await abrir();
  if (!db) return undefined;
  return new Promise((ok, no) => {
    const req = fn(db.transaction(STORE, modo).objectStore(STORE));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => no(req.error);
  });
}

// randomUUID só existe em contexto seguro (HTTPS/localhost); em HTTP puro cai para getRandomValues.
function novoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const avisar = () => window.dispatchEvent(new Event(EVENTO));

export async function listar(): Promise<Op[]> {
  const db = await abrir();
  const todas = db ? (await pedir<Op[]>("readonly", (s) => s.getAll())) ?? [] : [...memoria.values()];
  return todas.sort((a, b) => a.criadoEm - b.criadoEm);
}

async function gravar(op: Op) {
  if (await abrir()) await pedir("readwrite", (s) => s.put(op));
  else memoria.set(op.id, op);
}

export async function descartar(id: string) {
  if (await abrir()) await pedir("readwrite", (s) => s.delete(id));
  else memoria.delete(id);
  avisar();
}

async function usuarioAtual(): Promise<string | null> {
  try { return (await createClient().auth.getSession()).data.session?.user.id ?? null; } catch { return null; }
}

// ---- envio ----
type Envio = "ok" | "rede" | "erro";

async function enviar(op: Op): Promise<Envio> {
  const dados = { ...op.dados };
  try {
    if (op.tipo === "foto") {
      const os = String(dados.os_id);
      const caminho = `${os}/${op.id}.jpg`;
      if (!op.blob) return fail(op, "Foto perdida do aparelho.");
      const up = await createClient().storage.from("os-fotos").upload(caminho, op.blob, { contentType: "image/jpeg" });
      if (up.error) {
        const msg = up.error.message ?? "";
        const jaExiste = /already exists|duplicate/i.test(msg) || String((up.error as { statusCode?: string }).statusCode) === "409";
        if (!jaExiste) return /fetch|network|load failed/i.test(msg) ? "rede" : await fail(op, "Não foi possível enviar a foto.");
      }
      dados.caminho = caminho;
    }
    const r = await fetch("/api/ops", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: op.id, tipo: op.tipo, dados }),
    });
    if (r.ok) return "ok";
    // 401 (sessão vencida), 408, 429 e 5xx não são culpa da operação: ficam na fila.
    if (r.status === 401 || r.status === 408 || r.status === 429 || r.status >= 500) return "rede";
    const j = (await r.json().catch(() => ({}))) as { erro?: string };
    return await fail(op, j.erro ?? "O servidor recusou esta alteração.");
  } catch {
    return "rede";
  }
}

async function fail(op: Op, erro: string): Promise<"erro"> {
  await gravar({ ...op, erro });
  return "erro";
}

let rodando = false;

// Envia em ordem (um status depende do item lançado antes). Para na primeira falha de rede.
export async function processar(): Promise<number> {
  if (rodando || typeof window === "undefined") return 0;
  rodando = true;
  let enviadas = 0;
  try {
    const uid = await usuarioAtual();
    if (!uid) return 0;
    for (const op of await listar()) {
      if (op.erro || op.userId !== uid) continue; // de outro usuário: espera ele entrar de novo
      const r = await enviar(op);
      if (r === "rede") break;
      if (r === "ok") { await descartar(op.id); enviadas++; }
      avisar();
    }
  } finally {
    rodando = false;
    avisar();
  }
  return enviadas;
}

export async function executar(tipo: TipoOp, dados: Record<string, unknown>, blob?: Blob): Promise<Resultado> {
  const op: Op = { id: novoId(), tipo, dados, blob, userId: await usuarioAtual(), criadoEm: Date.now() };
  await gravar(op);
  avisar();
  await processar();
  const restante = (await listar()).find((o) => o.id === op.id);
  if (!restante) return { resultado: "enviada" };
  return restante.erro ? { resultado: "erro", erro: restante.erro } : { resultado: "fila" };
}
