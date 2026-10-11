export const STATUS = [
  ["aguardando", "Aguardando"],
  ["diagnostico", "Em diagnóstico"],
  ["aprovacao", "Aguardando aprovação"],
  ["em_servico", "Em serviço"],
  ["pronto", "Pronto"],
  ["entregue", "Entregue"],
  ["cancelada", "Cancelada"],
] as const;

export const statusLabel = (s: string) => STATUS.find(([k]) => k === s)?.[1] ?? s;
export const normPlaca = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function waTo(phone: string | null | undefined, text: string) {
  const d = (phone ?? "").replace(/\D/g, "");
  const n = d ? (d.startsWith("55") ? d : `55${d}`) : "";
  return `https://api.whatsapp.com/send?${n ? `phone=${n}&` : ""}text=${encodeURIComponent(text)}`;
}

// Datas "só dia" (AAAA-MM-DD) no horário da oficina (Bahia, UTC-3, sem horário de verão).
// O servidor roda em UTC: sem fixar o fuso, depois das 21h "hoje" viraria amanhã.
export const TZ = "America/Bahia";
export const hojeISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
export const mesesDepois = (m: number) => {
  const [a, mes, d] = hojeISO().split("-").map(Number);
  const dt = new Date(Date.UTC(a, mes - 1 + m, d));
  // dia 31 + 1 mês: o JS rola para o mês seguinte; volta para o último dia do mês desejado
  if (dt.getUTCDate() !== d) dt.setUTCDate(0);
  return dt.toISOString().slice(0, 10);
};
export const diaBR = (d: string) => d.split("-").reverse().join("/");

// Aceita "1.500,00", "12,5", "12.5" e "1.500"
export const num = (s: string) => {
  const t = s.trim();
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", ".")) || 0;
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, "")) || 0;
  return Number(t) || 0;
};
// Número inteiro a partir do que foi digitado ("85.500" vira 85500)
export const inteiro = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d ? parseInt(d, 10) : null;
};

export const diasDesde = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
