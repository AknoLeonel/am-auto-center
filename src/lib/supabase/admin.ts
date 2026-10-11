import { createClient } from "@supabase/supabase-js";

// Cliente com chave de serviço (ignora o RLS). Só no servidor e só para tarefas sem usuário logado:
// enviar push e o resumo diário. NUNCA importe em componente de cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
