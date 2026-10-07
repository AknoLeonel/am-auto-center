import type { Metadata } from "next";
import { PainelShell } from "@/components/PainelShell";

export const metadata: Metadata = { title: "Painel | AM Auto Center", robots: { index: false, follow: false } };

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <PainelShell>{children}</PainelShell>;
}
