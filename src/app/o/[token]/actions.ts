"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enviarPush } from "@/lib/push";

export type RespostaEstado = { erro?: string };

// Ação pública: o token (UUID aleatório) é a credencial. A regra fica na função SQL responder_orcamento.
export async function responderOrcamento(_: RespostaEstado, f: FormData): Promise<RespostaEstado> {
  const token = z.uuid().safeParse(String(f.get("token") ?? ""));
  if (!token.success) return { erro: "Link inválido." };
  const aprovar = f.get("decisao") === "aprovar";
  const nome = String(f.get("nome") ?? "").trim().slice(0, 120);
  if (aprovar && nome.length < 3) return { erro: "Digite seu nome completo para aprovar." };

  const supabase = await createClient();
  // Só notifica na primeira resposta (um segundo toque no mesmo botão não repete o aviso).
  const antes = (await supabase.rpc("orcamento_publico", { p_token: token.data })).data as { status: string; numero: number; placa: string } | null;
  const { error } = await supabase.rpc("responder_orcamento", { p_token: token.data, p_aprovar: aprovar, p_nome: nome });
  if (error) return { erro: error.code === "22023" ? error.message : "Não foi possível registrar sua resposta. Tente de novo." };
  if (antes?.status === "pendente") {
    after(() => enviarPush({
      titulo: aprovar ? "Orçamento APROVADO" : "Orçamento recusado",
      corpo: `OS ${antes.numero} · ${antes.placa}`, url: "/painel", tag: `orcamento-${antes.numero}`,
    }));
  }
  revalidatePath(`/o/${token.data}`);
  return {};
}
