import { PedidoRapido, type Modo } from "./PedidoRapido";

// Âncoras /#pedido-guincho, /#pedido-orcamento e /#pedido-agendar rolam até aqui e abrem a aba certa.
export function SecaoPedido({ inicial, servico, titulo = "Do que você precisa agora?" }: { inicial?: Modo; servico?: string; titulo?: string }) {
  return (
    <section id="pedido" className="bg-asphalt px-4 py-12 text-white lg:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-12">
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">{titulo}</h2>
          <p className="mt-3 max-w-md text-lg text-white/80">
            Preencha o que souber em poucos toques. A mensagem vai pronta para o WhatsApp da oficina.
          </p>
          <ul className="mt-5 hidden space-y-2 text-white/85 sm:block">
            <li className="flex gap-2"><span aria-hidden className="text-signal">✓</span> Guincho para carro, moto, SUV e caminhão</li>
            <li className="flex gap-2"><span aria-hidden className="text-signal">✓</span> Orçamento antes de qualquer serviço</li>
            <li className="flex gap-2"><span aria-hidden className="text-signal">✓</span> Agendamento confirmado pela equipe</li>
          </ul>
        </div>
        {/* as âncoras ficam no cartão: no celular, o link leva direto ao formulário */}
        <div className="relative">
          <span id="pedido-guincho" className="absolute top-0" aria-hidden />
          <span id="pedido-orcamento" className="absolute top-0" aria-hidden />
          <span id="pedido-agendar" className="absolute top-0" aria-hidden />
          <PedidoRapido inicial={inicial} servico={servico} />
        </div>
      </div>
    </section>
  );
}
