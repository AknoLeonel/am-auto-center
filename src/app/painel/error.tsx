"use client";
import { btnPrimary } from "@/components/ui";

export default function ErroPainel({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-10 text-center">
      <h1 className="font-display text-4xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-mute">{error.message || "Tente novamente em instantes."}</p>
      <button type="button" onClick={reset} className={`${btnPrimary} mt-5`}>Tentar de novo</button>
    </div>
  );
}
