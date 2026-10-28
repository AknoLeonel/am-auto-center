# Manual da equipe: AM Auto Center

Para quem usa o painel no dia a dia (dono, atendente e mecânico). Sem termos técnicos.

## Primeiro acesso

1. Abra o endereço do painel no **celular** (navegador Chrome no Android, Safari no iPhone) e entre com o seu e-mail e senha.
2. **Instale como app**: no Android toque em *Instalar app* (aparece no topo); no iPhone toque em *Compartilhar* e depois *Adicionar à Tela de Início*.
3. Se aparecer "aguardando liberação", peça ao dono para liberar o seu acesso em **Mais > Equipe**.

Quem vê o quê: o **mecânico** trabalha nas ordens de serviço; o **atendente** também cuida de clientes, estoque, pagamentos e relatórios; o **dono** vê tudo, inclusive o Financeiro, a Auditoria e a Equipe.

## Atender um carro (o dia a dia)

1. **Nova OS** (botão azul na barra de baixo): digite a **placa** e toque em *Buscar*. Se o carro já veio, os dados aparecem sozinhos. Se não, preencha o cliente e o veículo.
2. Descreva o **defeito** que o cliente relatou e abra a ordem.
3. **Fotos**: na ordem, toque em *Tirar ou escolher fotos*. Tire do problema e do carro na chegada. As fotos ficam guardadas na ordem.
4. **Serviços e peças**: lance cada item com a quantidade e o valor. Se a peça está no **estoque**, escolha ela na lista: o sistema desconta do estoque sozinho (e devolve se você remover o item).
5. **Situação**: toque na situação atual do carro (Aguardando, Em diagnóstico, Aguardando aprovação, Em serviço, Pronto, Entregue). Quem olha o **Quadro** vê o carro andar de coluna em coluna.
6. **Orçamento digital**: com os itens lançados, toque em *Gerar link de orçamento* e depois em *Enviar link no WhatsApp*. O cliente vê os itens no celular e **aprova com um toque**. A aprovação fica registrada (nome e data) e a ordem passa sozinha para *Em serviço*. Se mudar algum valor, gere um orçamento novo: o link antigo deixa de valer.
7. **Acompanhamento**: *Enviar link de acompanhamento* manda ao cliente uma página que mostra em que etapa está o carro, sem valores.
8. **Pagamento** (dono e atendente): na ordem, registre quanto o cliente pagou e como (Pix, dinheiro, cartão...). Pode ser em partes e com a data em que o cliente pagou (um Pix de sábado lançado na segunda cai no sábado). Se o valor passar do que falta, o sistema pede confirmação (adiantamento). O que falta aparece em *Mais > Contas a receber*, com botão para cobrar pelo WhatsApp.
9. **Pronto e entrega**: marque *Pronto* e use *Avisar: carro pronto*. Ao marcar *Entregue*, começa a contar a **garantia**.
10. **Lembrete de volta**: na ordem, agende o aviso de retorno (troca de óleo, revisão...). No dia, o cliente aparece em **Retornos** com a mensagem pronta.

## Sem internet na oficina

O app continua funcionando. Você pode mudar a situação, anotar observações, lançar itens e tirar fotos: tudo fica **guardado no celular** e sobe sozinho quando o sinal voltar. Uma faixa amarela no topo avisa "Sem sinal" e quantas coisas aguardam. Em *Aguardando envio*, dentro da ordem, você vê o que ainda não subiu.
- Se o sistema recusar alguma coisa (por exemplo, peça sem estoque), aparece uma faixa vermelha explicando. Toque em *Descartar* e refaça.
- Antes de **sair da conta**, confira se não há nada aguardando envio.
- Telas que você ainda **não abriu hoje** não carregam sem sinal. Abra as ordens do dia pela manhã, com internet.

## Outras telas

- **Agenda**: horários marcados, com botão para confirmar com o cliente pelo WhatsApp.
- **Estoque** (*Mais*): peças, preços, "acabando" em vermelho. Só dono e atendente cadastram e ajustam. Para entrada de peças, digite a quantidade no campo da peça (use `-2` para corrigir para menos).
- **Pedidos** (*Mais*): pedidos de peças, guincho e orçamento que chegam pelo site. Um número vermelho avisa quantos são novos.
- **Notificações** (*Mais*): ative para receber aviso no celular quando chegar pedido novo ou o cliente responder um orçamento.
- **Financeiro** (dono): receita, margem, ticket médio e tempo de reparo. A margem considera só o custo das peças do estoque.
- **Relatórios** (dono e atendente): baixe planilhas (CSV) para abrir no Excel.
- **Site e conversões** (dono e atendente): quantas pessoas abriram o site e clicaram em WhatsApp, ligar ou rota.

## Problemas comuns

| O que aconteceu | O que fazer |
|---|---|
| "Não foi possível abrir esta tela" | Toque em *Abrir o diagnóstico*. Se o diagnóstico mostrar algo faltando, avise quem cuida do sistema (veja `docs/OPERACAO.md`). Anote o *Código do erro* da tela. |
| "Aguardando liberação" | O dono precisa liberar seu acesso em *Mais > Equipe*. |
| Esqueci a senha | Peça ao dono para redefinir no painel do Supabase (Authentication > Users). |
| O cliente diz que o link de orçamento não abre | Gere um novo orçamento e envie de novo. Links antigos deixam de valer. |
| Fiz algo errado em uma ordem | Quem faz a conferência é o dono, em *Mais > Auditoria*, que mostra quem mudou o quê e quando. |
