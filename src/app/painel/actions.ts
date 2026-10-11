"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mesesDepois } from "@/lib/painel";
import { itemSchema, novaOSSchema, pedidoStatusSchema, primeiroErro, statusSchema } from "@/lib/validacao";
import { z } from "zod";

export type Estado = { erro?: string };

// Toda action confere a sessão: Server Actions são alcançáveis por POST direto.
// A autorização de verdade é o RLS no banco.
async function equipe() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return supabase;
}

const campo = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function criarOS(_: Estado, f: FormData): Promise<Estado> {
  const supabase = await equipe();
  const p = novaOSSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const d = p.data;

  const { data, error } = await supabase.rpc("criar_os", {
    p_placa: d.placa, p_nome: d.nome, p_telefone: d.telefone, p_tipo: d.tipo,
    p_modelo: d.modelo, p_ano: d.ano, p_km: d.km, p_defeito: d.defeito,
  });
  if (error) {
    if (error.code === "23505") return { erro: "Essa placa já está cadastrada. Busque a placa de novo." };
    if (error.code === "22023") return { erro: error.message };
    return { erro: "Não foi possível salvar. Tente novamente." };
  }
  revalidatePath("/painel", "layout");
  redirect(`/painel/os/${data}`);
}

export async function mudarStatus(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  const status = statusSchema.parse(campo(f, "status"));
  const { error } = await supabase.from("ordens_servico").update({
    status, concluido_em: status === "pronto" || status === "entregue" ? new Date().toISOString() : null,
  }).eq("id", osId);
  if (error) throw new Error("Não foi possível mudar a situação.");
  revalidatePath("/painel", "layout");
}

export async function salvarObs(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  const obs = campo(f, "obs").trim().slice(0, 2000);
  const { error } = await supabase.from("ordens_servico").update({ observacoes: obs || null }).eq("id", osId);
  if (error) throw new Error("Não foi possível salvar as observações.");
  revalidatePath(`/painel/os/${osId}`);
}

export async function addItem(_: Estado, f: FormData): Promise<Estado> {
  const supabase = await equipe();
  const p = itemSchema.safeParse(Object.fromEntries([...f].map(([k, v]) => [k, String(v)])));
  if (!p.success) return { erro: primeiroErro(p.error) };
  const { osId, tipo, descricao, qtd, valor } = p.data;
  const { error } = await supabase.from("os_itens").insert({ os_id: osId, tipo, descricao, qtd, valor_unit: valor });
  if (error) return { erro: "Não foi possível adicionar o item." };
  revalidatePath(`/painel/os/${osId}`);
  return {};
}

export async function delItem(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  const { error } = await supabase.from("os_itens").delete().eq("id", z.uuid().parse(campo(f, "itemId"))).eq("os_id", osId);
  if (error) throw new Error("Não foi possível remover o item.");
  revalidatePath(`/painel/os/${osId}`);
}

export async function criarLembrete(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  const motivo = z.string().trim().min(1).max(100).parse(campo(f, "motivo"));
  const meses = z.coerce.number().int().min(1).max(24).parse(campo(f, "meses"));
  const o = await supabase.from("ordens_servico").select("cliente_id,veiculo_id").eq("id", osId).single();
  if (o.error) throw new Error("Ordem não encontrada.");
  const { error } = await supabase.from("lembretes").insert({
    cliente_id: o.data.cliente_id, veiculo_id: o.data.veiculo_id, os_id: osId, motivo, data_aviso: mesesDepois(meses),
  });
  if (error) throw new Error("Não foi possível agendar o lembrete.");
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/retornos");
}

export async function removerLembrete(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  await supabase.from("lembretes").delete().eq("id", z.uuid().parse(campo(f, "id")));
  revalidatePath(`/painel/os/${osId}`);
  revalidatePath("/painel/retornos");
}

export async function lembreteAvisado(f: FormData) {
  const supabase = await equipe();
  await supabase.from("lembretes").update({ enviado: true }).eq("id", z.uuid().parse(campo(f, "id")));
  revalidatePath("/painel/retornos");
}

export async function lembreteAdiar(f: FormData) {
  const supabase = await equipe();
  await supabase.from("lembretes").update({ data_aviso: mesesDepois(1) }).eq("id", z.uuid().parse(campo(f, "id")));
  revalidatePath("/painel/retornos");
}

export async function mudarPedido(f: FormData) {
  const supabase = await equipe();
  const status = pedidoStatusSchema.parse(campo(f, "status"));
  const { error } = await supabase.from("pedidos_site").update({ status }).eq("id", z.uuid().parse(campo(f, "id")));
  if (error) throw new Error("Não foi possível atualizar o pedido.");
  revalidatePath("/painel", "layout");
}

export async function registrarFoto(osId: string, caminho: string): Promise<Estado> {
  const supabase = await equipe();
  const id = z.uuid().parse(osId);
  // O caminho precisa estar dentro da pasta da própria OS.
  if (!new RegExp(`^${id}/[0-9a-f-]{36}\\.jpg$`).test(caminho)) return { erro: "Arquivo inválido." };
  const { error } = await supabase.from("os_fotos").insert({ os_id: id, caminho });
  if (error) return { erro: "Não foi possível registrar a foto." };
  revalidatePath(`/painel/os/${id}`);
  return {};
}

export async function removerFoto(f: FormData) {
  const supabase = await equipe();
  const osId = z.uuid().parse(campo(f, "osId"));
  const { data } = await supabase.from("os_fotos").delete().eq("id", z.uuid().parse(campo(f, "id"))).eq("os_id", osId)
    .select("caminho").single();
  if (data) await supabase.storage.from("os-fotos").remove([data.caminho]);
  revalidatePath(`/painel/os/${osId}`);
}
