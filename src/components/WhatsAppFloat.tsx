"use client";
import { useEffect, useState } from "react";
import { wa, defaultMsg } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function WhatsAppFloat() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <a
      href={wa(defaultMsg)} target="_blank" rel="noopener" aria-label="Chamar no WhatsApp"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      className="fixed right-4 z-40 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-wa px-4 font-bold text-white shadow-xl hover:brightness-110 sm:px-5"
    >
      <WhatsAppIcon className="h-6 w-6" /> <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
