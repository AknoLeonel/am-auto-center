"use client";
import { useRouter } from "next/navigation";
import { executar, type TipoOp } from "@/lib/fila";
import { useToast } from "./ui/Toast";

// Grava na fila local, tenta enviar e avisa o usuário do que aconteceu.
export function useEnviar() {
  const router = useRouter();
  const toast = useToast();
  return async function enviar(tipo: TipoOp, dados: Record<string, unknown>, blob?: Blob, msgOk?: string) {
    const r = await executar(tipo, dados, blob);
    if (r.resultado === "enviada") { if (msgOk) toast.ok(msgOk); router.refresh(); }
    else if (r.resultado === "fila") toast.ok("Sem sinal: salvo no aparelho. Envio automático quando a internet voltar.");
    else toast.erro(r.erro ?? "Não foi possível salvar.");
    return r;
  };
}
