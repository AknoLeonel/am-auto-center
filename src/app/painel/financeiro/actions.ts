"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEquipe } from "@/lib/sessao";
import { pagamentoSchema, primeiroErro } from "@/lib/validacao";
import { brl, hojeISO } from "@/lib/painel";

export type PagEstado = { erro?: string; excede?: boolean };

export async function registrarPagamento(_: PagEstado, f: FormData): Promise<PagEstado> {
  const supabase = await exigirEquipe();
  const p = pagamentoSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const { osId, valor, forma, obs, data, confirmo } = p.data;

  // Data retroativa (Pix de sábado lançado na segunda) cai no dia certo do caixa; hoje usa a hora atual.
  const hoje = hojeISO();
  if (data && data > hoje) return { erro: "A data do pagamento não pode ser no futuro." };
  const pagoEm = data && data !== hoje ? `${data}T12:00:00-03:00` : new Date().toISOString();

  const { data: os } = await supabase.from("os_financeiro").select("status,saldo").eq("id", osId).maybeSingle();
  if (!os) return { erro: "Ordem de serviço não encontrada." };
  if (os.status === "cancelada") return { erro: "Ordem cancelada não recebe pagamento." };
  const saldo = Math.round(Number(os.saldo) * 100) / 100;
  if (valor > saldo + 0.005 && confirmo !== "1") {
    return {
      excede: true,
      erro: saldo > 0
        ? `O valor passa do que falta receber (${brl(saldo)}). Confira o valor ou confirme abaixo se é adiantamento.`
        : "Esta ordem já está quitada. Confira o valor ou confirme abaixo se é adiantamento.",
    };
  }

  const { error } = await supabase.from("pagamentos").insert({ os_id: osId, valor, forma, obs: obs || null, pago_em: pagoEm });
  if (error) {
    if (error.code === "42501") return { erro: "Só dono e atendente registram pagamentos." };
    if (error.code === "22023") return { erro: error.message };
    return { erro: "Não foi possível registrar o pagamento." };
  }
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/financeiro", "layout");
  return {};
}

export async function estornarPagamento(f: FormData) {
  const supabase = await exigirEquipe();
  const osId = z.uuid().parse(String(f.get("osId")));
  const { data, error } = await supabase.from("pagamentos").delete().eq("id", z.uuid().parse(String(f.get("id")))).select("id");
  if (error || !data?.length) throw new Error("Só o dono pode estornar um pagamento.");
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/financeiro", "layout");
}
