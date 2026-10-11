"use client";
import { useActionState } from "react";
import { responderOrcamento, type RespostaEstado } from "@/app/o/[token]/actions";
import { input } from "./ui";

export function RespostaOrcamento({ token }: { token: string }) {
  const [estado, action] = useActionState<RespostaEstado, FormData>(responderOrcamento, {});
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="token" value={token} />
      <label htmlFor="nome" className="mb-1 block text-sm font-semibold">Seu nome completo (para aprovar)</label>
      <input id="nome" name="nome" autoComplete="name" className={input} />
      {estado.erro && <p role="alert" className="mt-2 text-sm text-red-700">{estado.erro}</p>}
      <div className="mt-4 grid gap-2">
        <button name="decisao" value="aprovar" className="inline-flex min-h-14 items-center justify-center rounded-lg bg-wa px-5 text-lg font-bold text-white active:brightness-90">
          Aprovar orçamento
        </button>
        <button name="decisao" value="recusar" formNoValidate
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-line bg-white px-5 font-bold">
          Não quero seguir
        </button>
      </div>
      <p className="mt-3 text-xs text-mute">Ao aprovar, registramos seu nome e a data como aceite do orçamento.</p>
    </form>
  );
}

