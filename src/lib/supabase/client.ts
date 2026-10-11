import { createBrowserClient } from "@supabase/ssr";

// Cliente do navegador: guarda a sessão em cookies, que o proxy e o servidor também leem.
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
