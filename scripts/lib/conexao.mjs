import pg from "pg";

// Cria o cliente a partir da connection string do Supabase (Connect > Session pooler), cuidando de senha com símbolos e de SSL.
export function criarCliente(url) {
  if (!url) throw new Error('Faltou a connection string (Supabase > botão Connect > Session pooler).');
  let u;
  try { u = new URL(url); } catch { throw new Error("A connection string parece inválida. Confira se copiou inteira e se trocou [YOUR-PASSWORD] pela senha."); }
  if (/^\[.*\]$/.test(decodeURIComponent(u.password))) throw new Error("Você esqueceu de trocar [YOUR-PASSWORD] pela senha do banco.");
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  const c = new pg.Client({
    host: u.hostname, port: Number(u.port || 5432), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.slice(1) || "postgres"), ssl: local ? false : { rejectUnauthorized: false },
  });
  c.on("error", () => {});
  return c;
}
