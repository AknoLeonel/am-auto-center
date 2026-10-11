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
    const { registrarPedidoServidor } = await import("@/app/pedido-action");
    await registrarPedidoServidor(p);
  } catch {}
}
