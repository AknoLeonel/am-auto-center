"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";
import { pagamentoSchema, primeiroErro } from "@/lib/validacao";

export type PagEstado = { erro?: string };

export async function registrarPagamento(_: PagEstado, f: FormData): Promise<PagEstado> {
  const supabase = await exigirEquipe();
  const p = pagamentoSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const { osId, valor, forma, obs } = p.data;
  const { error } = await supabase.from("pagamentos").insert({ os_id: osId, valor, forma, obs: obs || null });
  if (error) return { erro: error.code === "42501" ? "Só dono e atendente registram pagamentos." : "Não foi possível registrar o pagamento." };
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/financeiro", "layout");
  return {};
}

export async function estornarPagamento(f: FormData) {
  const supabase = await exigirEquipe();
  const osId = z.uuid().parse(String(f.get("osId")));
  const { data, error } = await supabase.from("pagamentos").delete().eq("id", z.uuid().parse(String(f.get("id")))).select("id");
  if (error || !data?.length) throw new Error("Só o dono pode estornar um pagamento.");
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/financeiro", "layout");
}
