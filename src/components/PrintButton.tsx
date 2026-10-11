"use client";
import { btnPrimary } from "./ui";

export function PrintButton() {
  return (
    <div className="no-print mb-4 flex gap-2">
      <button type="button" className={btnPrimary} onClick={() => window.print()}>Imprimir ou salvar PDF</button>
      <button type="button" className="min-h-12 px-3 font-semibold underline" onClick={() => window.history.back()}>Voltar</button>
    </div>
  );
}
