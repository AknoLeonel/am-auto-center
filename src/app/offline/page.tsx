import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão", robots: { index: false, follow: false } };

export default function Offline() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-asphalt px-6 text-center text-white">
      <p className="font-display text-2xl font-extrabold">AM <span className="text-signal">AUTO CENTER</span></p>
      <h1 className="mt-4 font-display text-5xl font-bold leading-none">Sem conexão</h1>
      <p className="mt-3 max-w-sm text-white/80">
        Esta página ainda não foi aberta neste aparelho. Volte a uma tela que você já viu hoje, ou tente de novo quando o sinal voltar.
        O que você salvou continua guardado e sobe sozinho.
      </p>
      <a href="/painel" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-6 font-bold text-white">Tentar de novo</a>
    </main>
  );
}
