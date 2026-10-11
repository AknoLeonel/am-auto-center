"use client";
import { useFormStatus } from "react-dom";

// Botão de envio que desabilita e troca o texto enquanto a action roda (evita toque duplo).
export function SubmitButton({ children, pendente = "Salvando...", className = "" }: {
  children: React.ReactNode; pendente?: string; className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className}>
      {pending ? pendente : children}
    </button>
  );
}
