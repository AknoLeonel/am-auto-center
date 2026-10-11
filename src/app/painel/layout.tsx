import type { Metadata } from "next";
import { PainelShell } from "@/components/PainelShell";
import { InstallBanner } from "@/components/InstallBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";
import { RegistrarSW } from "@/components/RegistrarSW";

export const metadata: Metadata = {
  title: "Painel | AM Auto Center",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "AM Painel", statusBarStyle: "black-translucent" },
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { count } = await supabase.from("pedidos_site").select("id", { count: "exact", head: true }).eq("status", "novo");

  return (
    <>
      <ToastProvider>
        <PainelShell novos={count ?? 0}>
          <InstallBanner />
          {children}
        </PainelShell>
      </ToastProvider>
      <RegistrarSW />
    </>
  );
}
