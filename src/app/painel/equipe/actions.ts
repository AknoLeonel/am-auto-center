"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";

const membro = z.object({
  userId: z.uuid(),
  nome: z.string().trim().min(1, "Informe o nome.").max(60),
  papel: z.enum(["dono", "atendente", "mecanico"]),
  ativo: z.enum(["0", "1"]),
});

// Só o dono altera perfis (o RLS garante; aqui vêm as proteções contra se trancar para fora).
export async function salvarMembro(f: FormData) {
  const supabase = await exigirEquipe();
  const p = membro.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) throw new Error(p.error.issues[0]?.message ?? "Dados inválidos.");

  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub === p.data.userId) throw new Error("Você não pode mudar o seu próprio acesso. Peça a outro dono.");

  const { data: alterado, error } = await supabase.from("perfis")
    .update({ nome: p.data.nome, papel: p.data.papel, ativo: p.data.ativo === "1" })
    .eq("user_id", p.data.userId).select("user_id");
  if (error || !alterado?.length) throw new Error("Só o dono pode alterar a equipe.");
  revalidatePath("/painel/equipe");
}
