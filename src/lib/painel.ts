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
export const num = (s: string) => Number(s.replace(",", ".")) || 0;

export function waTo(phone: string | null | undefined, text: string) {
  const d = (phone ?? "").replace(/\D/g, "");
  const n = d ? (d.startsWith("55") ? d : `55${d}`) : "";
  return `https://api.whatsapp.com/send?${n ? `phone=${n}&` : ""}text=${encodeURIComponent(text)}`;
}

// Datas "só dia" (AAAA-MM-DD) no horário local
export const hojeISO = () => new Date().toLocaleDateString("sv-SE");
export const mesesDepois = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString("sv-SE");
};
export const diaBR = (d: string) => d.split("-").reverse().join("/");
