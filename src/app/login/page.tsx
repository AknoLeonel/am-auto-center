"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { input, btnPrimary } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try { setEmail(localStorage.getItem("am-ultimo-email") ?? ""); } catch {}
    supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace("/painel"); });
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) { setErr("E-mail ou senha incorretos."); setBusy(false); return; }
    try { localStorage.setItem("am-ultimo-email", email.trim()); } catch {}
    router.replace("/painel");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-asphalt px-4">
      <form onSubmit={entrar} method="post" className="w-full max-w-sm rounded-xl border-t-[6px] border-signal bg-white p-6 text-ink shadow-xl">
        <p className="font-display text-2xl font-extrabold">AM <span className="text-brand">AUTO CENTER</span></p>
        <h1 className="mt-1 font-display text-4xl font-bold leading-none">Acesso da equipe</h1>
        <label htmlFor="email" className="mb-1 mt-5 block text-sm font-semibold">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" inputMode="email" autoCapitalize="none"
          className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="senha" className="mb-1 mt-3 block text-sm font-semibold">Senha</label>
        <input id="senha" name="password" type="password" required autoComplete="current-password"
          className={input} value={senha} onChange={(e) => setSenha(e.target.value)} />
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className={`${btnPrimary} mt-5 w-full`}>{busy ? "Entrando..." : "Entrar"}</button>
        <p className="mt-3 text-center text-xs text-mute">Você continua conectado neste aparelho até tocar em Sair.</p>
      </form>
    </main>
  );
}
