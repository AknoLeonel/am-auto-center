import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const texto = (n: number) => z.string().trim().max(n).optional().transform((s) => s || null);
const corpo = z.object({
  evento: z.enum(["visita", "whatsapp", "mapa", "instagram", "ligacao"]),
  origem: texto(60), pagina: z.string().trim().max(120).regex(/^\//),
  fonte: texto(60), meio: texto(60), campanha: texto(60), ref: texto(80),
  dispositivo: z.enum(["mobile", "desktop"]).optional(),
});
const ROBO = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|monitor/i;

// Sempre responde 204: quem mede não precisa saber se gravou, e o endpoint não revela nada.
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 204 });
    if (ROBO.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
    const p = corpo.safeParse(JSON.parse(await req.text()));
    if (!p.success) return new Response(null, { status: 204 });
    const supabase = await createClient();
    await supabase.from("eventos_site").insert({ ...p.data, dispositivo: p.data.dispositivo ?? null });
  } catch {}
  return new Response(null, { status: 204 });
}
