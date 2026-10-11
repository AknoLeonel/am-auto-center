"use client";
import { useActionState } from "react";
import { criarAgendamento, type AgendaEstado } from "@/app/painel/agenda/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary } from "./ui";

const lbl = "mb-1 mt-3 block text-sm font-semibold";

export function AgendaForm({ equipe }: { equipe: { user_id: string; nome: string }[] }) {
  const [estado, action] = useActionState<AgendaEstado, FormData>(criarAgendamento, {});
  return (
    <form action={action}>
      <label htmlFor="inicio" className={lbl}>Data e hora</label>
      <input id="inicio" name="inicio" type="datetime-local" required className={input} />
      <label htmlFor="descricao" className={lbl}>Serviço</label>
      <input id="descricao" name="descricao" required placeholder="Ex.: Revisão de freios" className={input} />
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="nome" className={lbl}>Cliente</label><input id="nome" name="nome" className={input} /></div>
        <div><label htmlFor="tel" className={lbl}>WhatsApp</label><input id="tel" name="telefone" type="tel" inputMode="tel" className={input} /></div>
        <div><label htmlFor="placa" className={lbl}>Placa</label><input id="placa" name="placa" maxLength={8} className={`${input} uppercase`} /></div>
        <div><label htmlFor="mec" className={lbl}>Mecânico</label>
          <select id="mec" name="mecanicoId" className={input}>
            <option value="">Qualquer um</option>
            {equipe.map((e) => <option key={e.user_id} value={e.user_id}>{e.nome}</option>)}
          </select></div>
      </div>
      {estado.erro && <p role="alert" className="mt-3 text-sm text-red-700">{estado.erro}</p>}
      {estado.ok && <p role="status" className="mt-3 text-sm font-semibold text-wa">Agendado!</p>}
      <SubmitButton pendente="Agendando..." className={`${btnPrimary} mt-4 w-full`}>Agendar</SubmitButton>
    </form>
  );
}
