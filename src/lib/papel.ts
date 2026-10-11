import type { SupabaseClient } from "@supabase/supabase-js";

export type Papel = "dono" | "atendente" | "mecanico";

// Papel do usuário logado (nulo se inativo). Usado só para decidir o que mostrar:
// quem barra o acesso aos dados é o RLS.
export async function papelAtual(supabase: SupabaseClient): Promise<Papel | null> {
  const { data } = await supabase.rpc("papel_atual");
  return (data as Papel | null) ?? null;
}

export const ehGestao = (p: Papel | null) => p === "dono" || p === "atendente";
