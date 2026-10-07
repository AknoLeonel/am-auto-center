"use client";
import { useState } from "react";
import { services, wa, defaultMsg } from "@/lib/site";
import { WhatsAppIcon } from "./WhatsAppIcon";
 
export function QuoteSelector() {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (t: string) =>
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
 
  const text = picked.length
    ? `Olá! Vim pelo site da AM Auto Center. Preciso de: ${picked.join(", ").toLowerCase()}. Pode me passar um orçamento?`
    : defaultMsg;
 
  return (
    <div className="rounded-xl border-t-[6px] border-signal bg-white text-ink p-5 shadow-xl sm:p-6">
      <h2 className="font-display text-3xl font-bold leading-none">Qual serviço você precisa?</h2>
      <p className="mt-2 text-sm text-mute">Escolha e continue no WhatsApp com a mensagem pronta.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Serviços">
        {services.map((s) => {
          const on = picked.includes(s.title);
          return (
            <button
              key={s.id} type="button" aria-pressed={on} onClick={() => toggle(s.title)}
              className={`min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold transition-colors ${
                on ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {s.title}
            </button>
          );
        })}
      </div>
      <a
        href={wa(text)} target="_blank" rel="noopener"
        className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-wa px-6 py-3.5 text-lg font-bold text-white hover:brightness-110"
      >
        <WhatsAppIcon /> Receber orçamento no WhatsApp
      </a>
      <p className="mt-3 text-center text-xs text-mute">Sem compromisso. Resposta direto da oficina.</p>
    </div>
  );
}
