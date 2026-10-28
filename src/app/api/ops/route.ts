import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { statusSchema } from "@/lib/validacao";

export const dynamic = "force-dynamic";

const uuid = z.uuid();
const dadosPorTipo = {
  status: z.object({ os_id: uuid, status: statusSchema, de: statusSchema.optional(), em: z.iso.datetime({ offset: true }).optional() }),
  obs: z.object({ os_id: uuid, obs: z.string().max(2000) }),
  item: z.object({
    os_id: uuid, tipo: z.enum(["servico", "peca"]), descricao: z.string().trim().min(1).max(200),
    qtd: z.number().positive().max(9999), valor: z.number().min(0).max(10_000_000), peca_id: uuid.nullish(),
  }),
  foto: z.object({ os_id: uuid, caminho: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/) }),
} as const;

const corpo = z.object({ id: uuid, tipo: z.enum(["status", "obs", "item", "foto"]), dados: z.record(z.string(), z.unknown()) });

const erro = (status: number, msg: string) => Response.json({ ok: false, erro: msg }, { status });

// Recebe operações da fila offline. A idempotência e as regras ficam no banco (aplicar_op).
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return erro(401, "Sessão expirada. Entre de novo.");

  const b = corpo.safeParse(await req.json().catch(() => null));
  if (!b.success) return erro(400, "Requisição inválida.");
  const d = dadosPorTipo[b.data.tipo].safeParse(b.data.dados);
  if (!d.success) return erro(422, d.error.issues[0]?.message ?? "Dados inválidos.");

  const { data: resultado, error } = await supabase.rpc("aplicar_op", { p_id: b.data.id, p_tipo: b.data.tipo, p_dados: d.data });
  if (error) {
    if (error.code === "42501") return erro(403, "Você não tem permissão para esta alteração.");
    if (error.code === "23514") return erro(422, "Estoque insuficiente ou valor inválido.");
    if (error.code === "P0002") return erro(422, "A ordem de serviço não existe mais.");
    if (error.code === "22023") return erro(422, "Dados inválidos.");
    return erro(500, "Erro ao salvar. Tentaremos de novo.");
  }
  if (resultado === "conflito") return erro(409, "Outra pessoa mudou a situação desta ordem antes. Confira e escolha de novo.");
  return Response.json({ ok: true, resultado });
}
