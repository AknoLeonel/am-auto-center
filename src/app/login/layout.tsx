import type { Metadata } from "next";
import { RegistrarSW } from "@/components/RegistrarSW";

export const metadata: Metadata = { title: "Acesso da equipe", robots: { index: false, follow: false } };

export default function L({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RegistrarSW />
    </>
  );
}
