"use client";
import { useEffect, useState } from "react";
import { EVENTO, listar, type Op } from "@/lib/fila";

// Lista da fila local, atualizada sempre que algo entra ou sai.
export function useFila(): Op[] {
  const [ops, setOps] = useState<Op[]>([]);
  useEffect(() => {
    let vivo = true;
    const ler = () => listar().then((l) => { if (vivo) setOps(l); });
    ler();
    window.addEventListener(EVENTO, ler);
    return () => { vivo = false; window.removeEventListener(EVENTO, ler); };
  }, []);
  return ops;
}
