"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Kind = "ok" | "erro";
type Toast = { id: number; kind: Kind; text: string };
type Ctx = { ok: (text: string) => void; erro: (text: string) => void };

const ToastCtx = createContext<Ctx>({ ok: () => {}, erro: () => {} });
export const useToast = () => useContext(ToastCtx);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);

  const push = useCallback((kind: Kind, text: string) => {
    const id = ++seq;
    setList((l) => [...l.slice(-2), { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === "erro" ? 6000 : 3000);
  }, []);

  const api = useMemo<Ctx>(() => ({ ok: (t) => push("ok", t), erro: (t) => push("erro", t) }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {list.map((t) => (
          <p key={t.id} role={t.kind === "erro" ? "alert" : "status"}
            className={`pointer-events-auto max-w-sm rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${t.kind === "erro" ? "bg-red-700" : "bg-asphalt"}`}>
            {t.text}
          </p>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
