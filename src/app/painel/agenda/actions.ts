"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";
import { agendaSchema, primeiroErro } from "@/lib/validacao";

export type AgendaEstado = { erro?: string; ok?: boolean };

export async function criarAgendamento(_: AgendaEstado, f: FormData): Promise<AgendaEstado> {
  const supabase = await exigirEquipe();
  const p = agendaSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const d = p.data;
  if (d.inicio.getTime() < Date.now() - 60 * 60 * 1000) return { erro: "Escolha uma data e hora futuras." };

  const { error } = await supabase.from("agendamentos").insert({
    inicio: d.inicio.toISOString(), descricao: d.descricao, nome: d.nome || null,
    telefone: d.telefone || null, placa: d.placa || null, mecanico_id: d.mecanicoId,
  });
  if (error) return { erro: "Não foi possível agendar." };
  revalidatePath("/painel/agenda");
  return { ok: true };
}

export async function mudarAgendamento(f: FormData) {
  const supabase = await exigirEquipe();
  const status = z.enum(["marcado", "concluido", "cancelado"]).parse(String(f.get("status")));
  const { error } = await supabase.from("agendamentos").update({ status }).eq("id", z.uuid().parse(String(f.get("id"))));
  if (error) throw new Error("Não foi possível atualizar o agendamento.");
  revalidatePath("/painel/agenda");
}
