type Pedido = {
  tipo: "pecas" | "guincho" | "orcamento";
  nome?: string;
  telefone?: string;
  veiculo?: string;
  mensagem: string;
};

// Nunca bloqueia o WhatsApp: se falhar, o cliente segue normalmente.
export async function registrarPedido(p: Pedido) {
  try {
    const { supabase } = await import("./supabase");
    await supabase.from("pedidos_site").insert({
      tipo: p.tipo,
      nome: p.nome?.slice(0, 120) || null,
      telefone: p.telefone?.replace(/\D/g, "").slice(0, 20) || null,
      veiculo: p.veiculo?.slice(0, 120) || null,
      mensagem: p.mensagem.slice(0, 1800),
    });
  } catch {}
}
