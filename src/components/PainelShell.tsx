"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const nav = [["Ordens", "/painel"], ["Nova OS", "/painel/nova"], ["Retornos", "/painel/retornos"]];

export function PainelShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setOk(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) router.replace("/login"); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ok) return <p className="p-8 text-mute">Carregando...</p>;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-asphalt pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <span className="font-display text-xl font-extrabold">AM <span className="text-signal">PAINEL</span></span>
          <nav className="flex items-center gap-1 text-sm font-semibold">
            {nav.map(([t, h]) => (
              <Link key={h} href={h} className={`rounded-md px-2 py-2 ${path === h ? "bg-white/15" : "text-white/75 hover:text-white"}`}>{t}</Link>
            ))}
            <button type="button" className="rounded-md px-2 py-2 text-white/75 hover:text-white"
              onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}>Sair</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
