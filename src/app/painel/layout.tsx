import type { Metadata } from "next";
import { PainelShell } from "@/components/PainelShell";
import { InstallBanner } from "@/components/InstallBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { RegistrarSW } from "@/components/RegistrarSW";

export const metadata: Metadata = {
  title: "Painel | AM Auto Center",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "AM Painel", statusBarStyle: "black-translucent" },
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastProvider>
        <PainelShell>
          <InstallBanner />
          {children}
        </PainelShell>
      </ToastProvider>
      <RegistrarSW />
    </>
  );
}
