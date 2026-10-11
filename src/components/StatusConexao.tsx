"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { descartar, processar } from "@/lib/fila";
import { useFila } from "./useFila";

// Barra fixa sob o cabeçalho: avisa que está sem sinal, mostra o que espera para subir e o que falhou.
export function StatusConexao() {
  const router = useRouter();
  const ops = useFila();
  const [online, setOnline] = useState(true);
  const pendentes = ops.filter((o) => !o.erro).length;
  const falhas = ops.filter((o) => o.erro);

  useEffect(() => {
    setOnline(navigator.onLine);
    const sincronizar = async () => { if ((await processar()) > 0) router.refresh(); };
    const ligou = () => { setOnline(true); sincronizar(); };
    const caiu = () => setOnline(false);
    const visivel = () => { if (document.visibilityState === "visible") sincronizar(); };
    window.addEventListener("online", ligou);
    window.addEventListener("offline", caiu);
    document.addEventListener("visibilitychange", visivel);
    sincronizar();
    const t = setInterval(sincronizar, 30000); // rede "ligada" mas instável: tenta de novo sozinho
    return () => {
      window.removeEventListener("online", ligou);
      window.removeEventListener("offline", caiu);
      document.removeEventListener("visibilitychange", visivel);
      clearInterval(t);
    };
  }, [router]);

  if (online && pendentes === 0 && falhas.length === 0) return null;

  return (
    <div className="sticky top-14 z-20 text-sm" style={{ top: "calc(3.5rem + env(safe-area-inset-top))" }}>
      {!online && (
        <p role="status" className="bg-amber-500 px-4 py-2 font-semibold text-black">
          Sem sinal. Pode continuar: o que você salvar fica no aparelho e sobe sozinho{pendentes ? ` (${pendentes} aguardando)` : ""}.
        </p>
      )}
      {online && pendentes > 0 && (
        <p role="status" className="bg-asphalt px-4 py-2 font-semibold text-white">Enviando {pendentes} {pendentes === 1 ? "alteração" : "alterações"}...</p>
      )}
      {falhas.map((o) => (
        <p key={o.id} role="alert" className="flex items-center justify-between gap-3 bg-red-700 px-4 py-2 text-white">
          <span>Não foi enviado: {o.erro}</span>
          <button type="button" onClick={() => descartar(o.id)} className="min-h-9 shrink-0 rounded border border-white/60 px-3 font-semibold">Descartar</button>
        </p>
      ))}
    </div>
  );
}
