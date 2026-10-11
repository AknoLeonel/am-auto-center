"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";
import { pecaSchema, primeiroErro } from "@/lib/validacao";
import { num } from "@/lib/painel";

export type PecaEstado = { erro?: string };

const SEM_PERMISSAO = "Só dono e atendente podem alterar o estoque.";

export async function salvarPeca(_: PecaEstado, f: FormData): Promise<PecaEstado> {
  const supabase = await exigirEquipe();
  const p = pecaSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const { id, nome, codigo, qtd, minimo, custo, preco } = p.data;
  const row = { nome, codigo: codigo || null, qtd, minimo, custo, preco };

  const { error } = id
    ? await supabase.from("pecas_estoque").update(row).eq("id", id)
    : await supabase.from("pecas_estoque").insert(row);
  if (error) return { erro: error.code === "42501" ? SEM_PERMISSAO : "Não foi possível salvar a peça." };
  revalidatePath("/painel/estoque");
  redirect("/painel/estoque");
}

// Entrada (positiva) ou correção (negativa) de estoque.
export async function ajustarEstoque(f: FormData) {
  const supabase = await exigirEquipe();
  const id = z.uuid().parse(String(f.get("id")));
  const delta = num(String(f.get("delta") ?? ""));
  if (!delta) return;
  const { error } = await supabase.rpc("ajustar_estoque", { p_id: id, p_delta: delta });
  if (error) {
    if (error.code === "23514") throw new Error("O estoque não pode ficar negativo.");
    throw new Error(error.code === "42501" ? SEM_PERMISSAO : "Não foi possível ajustar o estoque.");
  }
  revalidatePath("/painel/estoque");
}

export async function arquivarPeca(f: FormData) {
  const supabase = await exigirEquipe();
  const id = z.uuid().parse(String(f.get("id")));
  const ativo = f.get("ativo") === "1";
  const { error } = await supabase.from("pecas_estoque").update({ ativo }).eq("id", id);
  if (error) throw new Error(error.code === "42501" ? SEM_PERMISSAO : "Não foi possível atualizar a peça.");
  revalidatePath("/painel/estoque");
}
