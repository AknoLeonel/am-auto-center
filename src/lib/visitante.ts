import { createHash } from "node:crypto";
import { hojeISO } from "./painel";

// Resumo do aparelho (IP + navegador) que muda todo dia. Serve só para limitar abusos no site público:
// não dá para voltar ao IP nem ligar o mesmo visitante de um dia para o outro.
export function visitante(h: Headers): string {
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  const sal = process.env.CRON_SECRET || "am-auto-center";
  return createHash("sha256").update(`${ip}|${h.get("user-agent") ?? ""}|${hojeISO()}|${sal}`).digest("hex").slice(0, 32);
}
