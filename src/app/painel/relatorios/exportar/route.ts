import { createClient } from "@/lib/supabase/server";
import { papelAtual, ehGestao } from "@/lib/papel";
import { dataValida } from "@/lib/periodo";
import { TZ } from "@/lib/painel";

export const dynamic = "force-dynamic";

const LIMITE = 5000;
const dh = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TZ }) : "");
const dec = (n: unknown) => Number(n ?? 0).toFixed(2).replace(".", ",");
// Texto vindo do usuário: neutraliza fórmulas (=, +, -, @) que o Excel executaria ao abrir o arquivo.
const txt = (s: unknown) => {
  const v = String(s ?? "");
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
};
const celula = (v: string) => `"${v.replace(/"/g, '""')}"`;
const csv = (cab: string[], linhas: string[][]) =>
  "﻿" + [cab, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n") + "\r\n";

// Início do dia na Bahia (UTC-3) para filtrar por período fechado [ini, fim].
const inicioDia = (d: string) => new Date(`${d}T00:00:00-03:00`).toISOString();
const diaSeguinte = (d: string) => new Date(new Date(`${d}T00:00:00-03:00`).getTime() + 86400000).toISOString();

export async function GET(req: Request) {
  const supabase = await createClient();
  if (!ehGestao(await papelAtual(supabase))) return new Response("Sem permissão", { status: 403 });

  const u = new URL(req.url);
  const tipo = u.searchParams.get("tipo");
  const ini = u.searchParams.get("ini") ?? "";
  const fim = u.searchParams.get("fim") ?? "";
  if (!dataValida(ini) || !dataValida(fim) || fim < ini) return new Response("Período inválido", { status: 400 });
  const de = inicioDia(ini);
  const ate = diaSeguinte(fim);

  let corpo: string;
  if (tipo === "os") {
    const { data } = await supabase.from("os_financeiro")
      .select("numero,placa,modelo,cliente_nome,cliente_telefone,status,criado_em,entregue_em,total,custo,pago,saldo")
      .gte("criado_em", de).lt("criado_em", ate).order("criado_em").limit(LIMITE);
    corpo = csv(
      ["OS", "Placa", "Modelo", "Cliente", "Telefone", "Situação", "Abertura", "Entrega", "Total", "Custo das peças", "Recebido", "Saldo"],
      (data ?? []).map((r) => [String(r.numero), txt(r.placa), txt(r.modelo), txt(r.cliente_nome), txt(r.cliente_telefone), r.status,
        dh(r.criado_em), dh(r.entregue_em), dec(r.total), dec(r.custo), dec(r.pago), dec(r.saldo)]),
    );
  } else if (tipo === "pagamentos") {
    const { data } = await supabase.from("pagamentos")
      .select("pago_em,valor,forma,obs,ordens_servico(numero,clientes(nome),veiculos(placa))")
      .gte("pago_em", de).lt("pago_em", ate).order("pago_em").limit(LIMITE);
    type R = { pago_em: string; valor: number; forma: string; obs: string | null;
      ordens_servico: { numero: number; clientes: { nome: string } | null; veiculos: { placa: string } | null } | null };
    corpo = csv(
      ["Data", "OS", "Cliente", "Placa", "Forma", "Valor", "Observação"],
      ((data ?? []) as unknown as R[]).map((r) => [dh(r.pago_em), String(r.ordens_servico?.numero ?? ""), txt(r.ordens_servico?.clientes?.nome),
        txt(r.ordens_servico?.veiculos?.placa), r.forma, dec(r.valor), txt(r.obs)]),
    );
  } else if (tipo === "estoque") {
    const { data } = await supabase.from("pecas_estoque").select("nome,codigo,qtd,minimo,custo,preco").eq("ativo", true).order("nome").limit(LIMITE);
    corpo = csv(
      ["Peça", "Código", "Em estoque", "Mínimo", "Custo", "Preço de venda", "Valor a custo"],
      (data ?? []).map((r) => [txt(r.nome), txt(r.codigo), String(r.qtd).replace(".", ","), String(r.minimo).replace(".", ","),
        dec(r.custo), dec(r.preco), dec(Number(r.qtd) * Number(r.custo))]),
    );
  } else {
    return new Response("Tipo inválido", { status: 400 });
  }

  return new Response(corpo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="am-${tipo}-${ini}_a_${fim}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
