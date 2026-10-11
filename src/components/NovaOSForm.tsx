"use client";
import { useActionState } from "react";
import Link from "next/link";
import { criarOS, type Estado } from "@/app/painel/actions";
import { SubmitButton } from "./ui/SubmitButton";
import { input, btnPrimary, btnGhost, card } from "./ui";

export type VeiculoEncontrado = {
  modelo: string | null; ano: number | null; km: number | null;
  clientes: { nome: string; telefone: string | null };
};

const lbl = "mb-1 mt-3 block text-sm font-semibold";

export function NovaOSForm({ placa, found }: { placa: string; found: VeiculoEncontrado | null }) {
  const [estado, action] = useActionState<Estado, FormData>(criarOS, {});

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="placa" value={placa} />
      {found ? (
        <div className={card}>
          <p className="text-sm font-bold text-wa">Veículo já cadastrado</p>
          <p className="font-display text-2xl font-bold">{found.modelo || "Veículo"} {found.ano ?? ""}</p>
          <p className="text-mute">{found.clientes.nome}{found.clientes.telefone ? ` · ${found.clientes.telefone}` : ""}</p>
        </div>
      ) : (
        <div className={card}>
          <p className="text-sm font-bold text-brand">Placa nova: cadastre o cliente e o veículo</p>
          <label htmlFor="nome" className={lbl}>Nome do cliente</label>
          <input id="nome" name="nome" required autoComplete="off" className={input} />
          <label htmlFor="tel" className={lbl}>WhatsApp (com DDD)</label>
          <input id="tel" name="telefone" type="tel" inputMode="tel" autoComplete="off" placeholder="77 99999-9999" className={input} />
          <label htmlFor="tipo" className={lbl}>Tipo</label>
          <select id="tipo" name="tipo" defaultValue="carro" className={input}>
            <option value="carro">Carro</option><option value="moto">Moto</option>
            <option value="suv">SUV</option><option value="caminhao">Caminhão</option>
          </select>
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div><label htmlFor="modelo" className={lbl}>Modelo</label>
              <input id="modelo" name="modelo" placeholder="Ex.: Gol 1.0" className={input} /></div>
            <div><label htmlFor="ano" className={lbl}>Ano</label>
              <input id="ano" name="ano" inputMode="numeric" maxLength={4} placeholder="2015" className={input} /></div>
          </div>
        </div>
      )}

      <label htmlFor="km" className={lbl}>Quilometragem atual</label>
      <input id="km" name="km" inputMode="numeric" defaultValue={found?.km ?? ""} placeholder="Ex.: 85500" className={input} />
      <label htmlFor="defeito" className={lbl}>Defeito relatado pelo cliente</label>
      <textarea id="defeito" name="defeito" rows={3} className={input} />

      {estado.erro && <p role="alert" className="mt-3 text-sm text-red-700">{estado.erro}</p>}

      <div className="mt-5 flex gap-2">
        <SubmitButton pendente="Abrindo..." className={`${btnPrimary} flex-1`}>Abrir ordem de serviço</SubmitButton>
        <Link href="/painel" className={btnGhost}>Cancelar</Link>
      </div>
    </form>
  );
}
