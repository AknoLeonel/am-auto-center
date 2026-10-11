import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Garante sessão em Server Actions (alcançáveis por POST direto). A autorização real é o RLS.
export async function exigirEquipe() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return supabase;
}
