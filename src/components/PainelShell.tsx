"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const nav = [
  ["Ordens", "/painel"],
  ["Quadro", "/painel/quadro"],
  ["Nova OS", "/painel/nova"],
  ["Agenda", "/painel/agenda"],
  ["Pedidos", "/painel/pedidos"],
  ["Retornos", "/painel/retornos"],
  ["Estoque", "/painel/estoque"],
];
// No celular, o que é menos usado fica atrás de "Mais" (barra de 5 itens, alcançável com o polegar).
const navCelular = nav.slice(0, 4).concat([["Mais", "/painel/mais"]]);
const dentroDeMais = ["/painel/mais", "/painel/pedidos", "/painel/retornos", "/painel/estoque"];

export function PainelShell({ children, novos }: { children: React.ReactNode; novos: number }) {
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) router.replace("/login"); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const active = (h: string) => (h === "/painel/mais" ? dentroDeMais.some((p) => path.startsWith(p)) : h === "/painel" ? path === "/painel" || path.startsWith("/painel/os") : path.startsWith(h));
  const badge = (h: string) =>
    (h === "/painel/pedidos" || h === "/painel/mais") && novos > 0 ? <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{novos}</span> : null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-asphalt pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <span className="font-display text-xl font-extrabold">AM <span className="text-signal">PAINEL</span></span>
          <nav aria-label="Principal" className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {nav.map(([t, h]) => (
              <Link key={h} href={h} className={`rounded-md px-3 py-2 ${active(h) ? "bg-white/15" : "text-white/75 hover:text-white"}`}>{t}{badge(h)}</Link>
            ))}
          </nav>
          <button type="button" className="rounded-md px-3 py-2 text-sm font-semibold text-white/75 hover:text-white"
            onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); router.refresh(); }}>Sair</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-28">{children}</main>

      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-asphalt pb-[env(safe-area-inset-bottom)] text-white md:hidden">
        {navCelular.map(([t, h]) => (
          <Link key={h} href={h}
            className={`border-t-4 py-3 text-center text-xs font-semibold ${active(h) ? "border-signal text-white" : "border-transparent text-white/70"}`}>
            {t}{badge(h)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
