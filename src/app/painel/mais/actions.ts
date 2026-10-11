"use server";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";

const inscricao = z.object({
  endpoint: z.url().max(1000).refine((u) => u.startsWith("https://"), "Endpoint inválido."),
  p256dh: z.string().min(10).max(300),
  auth: z.string().min(8).max(100),
});

export async function salvarInscricao(dados: unknown): Promise<{ erro?: string }> {
  const supabase = await exigirEquipe();
  const p = inscricao.safeParse(dados);
  if (!p.success) return { erro: "Inscrição inválida." };
  // delete + insert: o mesmo aparelho pode se reinscrever com chaves novas
  await supabase.from("push_subs").delete().eq("endpoint", p.data.endpoint);
  const { error } = await supabase.from("push_subs").insert(p.data);
  return error ? { erro: "Não foi possível ativar as notificações." } : {};
}

export async function removerInscricao(endpoint: string): Promise<{ erro?: string }> {
  const supabase = await exigirEquipe();
  const { error } = await supabase.from("push_subs").delete().eq("endpoint", z.string().max(1000).parse(endpoint));
  return error ? { erro: "Não foi possível desativar." } : {};
}
