"use server";
import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarPush } from "@/lib/push";
import { visitante } from "@/lib/visitante";

const TIPO: Record<string, string> = { pecas: "Peças", guincho: "Guincho", orcamento: "Orçamento" };

const pedido = z.object({
  tipo: z.enum(["pecas", "guincho", "orcamento"]),
  nome: z.string().trim().max(120).nullish(),
  telefone: z.string().max(40).nullish(),
  veiculo: z.string().trim().max(120).nullish(),
  mensagem: z.string().trim().min(1).max(1800),
});

// Chamada pelo site público. Grava o pedido e avisa a equipe por push.
export async function registrarPedidoServidor(dados: unknown) {
  const p = pedido.safeParse(dados);
  if (!p.success) return;
  const supabase = await createClient();
  // A função do banco limita pedidos por telefone, por aparelho e por hora; acima do limite devolve "limite" e não grava.
  const { data, error } = await supabase.rpc("enviar_pedido_site", {
    p_tipo: p.data.tipo, p_nome: p.data.nome || null, p_telefone: p.data.telefone || null,
    p_veiculo: p.data.veiculo || null, p_mensagem: p.data.mensagem, p_visitante: visitante(await headers()),
  });
  if (error || data !== "ok") return;

  after(async () => {
    // Anti-spam: se já chegaram vários pedidos há pouco, não enche o celular da equipe de notificações.
    const admin = createAdminClient();
    if (admin) {
      const desde = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count } = await admin.from("pedidos_site").select("id", { count: "exact", head: true }).gte("criado_em", desde);
      if ((count ?? 0) > 3) return;
    }
    await enviarPush({
      titulo: p.data.tipo === "guincho" ? "Pedido de GUINCHO" : "Novo pedido do site",
      corpo: `${TIPO[p.data.tipo]}${p.data.nome ? ` · ${p.data.nome}` : ""}`,
      url: "/painel/pedidos", tag: "pedido-site",
    });
  });
}
