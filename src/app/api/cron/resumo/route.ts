import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarPush } from "@/lib/push";
import { hojeISO, TZ } from "@/lib/painel";

export const dynamic = "force-dynamic";

const igual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Resumo das 8h (Vercel Cron, veja vercel.json). A Vercel manda "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || !igual(req.headers.get("authorization") ?? "", `Bearer ${segredo}`)) return new Response("Não autorizado", { status: 401 });

  const admin = createAdminClient();
  if (!admin) return Response.json({ ok: false, erro: "SUPABASE_SERVICE_ROLE_KEY ausente" }, { status: 500 });

  // Higiene: eventos de medição do site com mais de ~13 meses não servem mais (best effort).
  await admin.from("erros_app").delete().lt("criado_em", new Date(Date.now() - 30 * 86400000).toISOString());
  await admin.from("eventos_site").delete().lt("criado_em", new Date(Date.now() - 400 * 86400000).toISOString());

  const hoje = hojeISO();
  const ini = new Date(`${hoje}T00:00:00-03:00`);
  const fim = new Date(ini.getTime() + 86400000);
  const [ret, ag, ped] = await Promise.all([
    admin.from("lembretes").select("id", { count: "exact", head: true }).eq("enviado", false).lte("data_aviso", hoje),
    admin.from("agendamentos").select("id", { count: "exact", head: true }).eq("status", "marcado").gte("inicio", ini.toISOString()).lt("inicio", fim.toISOString()),
    admin.from("pedidos_site").select("id", { count: "exact", head: true }).eq("status", "novo"),
  ]);
  const r = ret.count ?? 0, a = ag.count ?? 0, p = ped.count ?? 0;
  if (r + a + p === 0) return Response.json({ ok: true, enviado: false });

  const partes = [
    a > 0 && `${plural(a, "agendamento", "agendamentos")} hoje`,
    r > 0 && `${plural(r, "retorno", "retornos")} para avisar`,
    p > 0 && `${plural(p, "pedido novo", "pedidos novos")} do site`,
  ].filter(Boolean);
  await enviarPush({
    titulo: `Bom dia! ${new Date().toLocaleDateString("pt-BR", { weekday: "long", timeZone: TZ })}`,
    corpo: partes.join(" · "), url: a > 0 ? "/painel/agenda" : r > 0 ? "/painel/retornos" : "/painel/pedidos", tag: "resumo-dia",
  });
  return Response.json({ ok: true, enviado: true, retornos: r, agendamentos: a, pedidos: p });
}
