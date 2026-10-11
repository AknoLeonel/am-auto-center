"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type RespostaEstado = { erro?: string };

// Ação pública: o token (UUID aleatório) é a credencial. A regra fica na função SQL responder_orcamento.
export async function responderOrcamento(_: RespostaEstado, f: FormData): Promise<RespostaEstado> {
  const token = z.uuid().safeParse(String(f.get("token") ?? ""));
  if (!token.success) return { erro: "Link inválido." };
  const aprovar = f.get("decisao") === "aprovar";
  const nome = String(f.get("nome") ?? "").trim().slice(0, 120);
  if (aprovar && nome.length < 3) return { erro: "Digite seu nome completo para aprovar." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("responder_orcamento", { p_token: token.data, p_aprovar: aprovar, p_nome: nome });
  if (error) return { erro: error.code === "22023" ? error.message : "Não foi possível registrar sua resposta. Tente de novo." };
  revalidatePath(`/o/${token.data}`);
  return {};
}
