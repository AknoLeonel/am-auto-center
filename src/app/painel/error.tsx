"use client";
import Link from "next/link";
import { btnPrimary, btnGhost } from "@/components/ui";

// Em produção o Next esconde a mensagem real do servidor (por segurança) e mostra só um código.
// Por isso a explicação é sobre as causas mais comuns, e há um atalho para o diagnóstico.
export default function ErroPainel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-10 text-center">
      <h1 className="font-display text-4xl font-bold">Não foi possível abrir esta tela</h1>
      <p className="mt-2 text-mute">
        Isso costuma acontecer quando o banco de dados ainda não recebeu todas as atualizações ou falta alguma configuração.
        O diagnóstico mostra exatamente o que falta.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/painel/diagnostico" className={btnPrimary}>Abrir o diagnóstico</Link>
        <button type="button" onClick={reset} className={btnGhost}>Tentar de novo</button>
      </div>
      {error.digest && <p className="mt-5 text-xs text-mute">Código do erro: {error.digest} (procure por ele nos logs da Vercel)</p>}
    </div>
  );
}
