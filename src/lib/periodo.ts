import { hojeISO } from "./painel";

export const PERIODOS: [string, string][] = [["7", "7 dias"], ["30", "30 dias"], ["90", "90 dias"], ["mes", "Este mês"]];

const somaDias = (iso: string, n: number) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};

// Intervalo [ini, fim] em datas da Bahia. "7" = hoje e os 6 dias anteriores.
export function periodo(p: string | undefined) {
  const fim = hojeISO();
  const chave = PERIODOS.some(([k]) => k === p) ? p! : "30";
  const ini = chave === "mes" ? `${fim.slice(0, 8)}01` : somaDias(fim, -(Number(chave) - 1));
  return { chave, ini, fim };
}

export const dataValida = (s: string | undefined) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
