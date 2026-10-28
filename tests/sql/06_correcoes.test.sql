-- Correções da revisão: datas de status, estoque no cancelamento, fila offline, limites do site, pagamentos e link.
begin;
do $$
declare v_dono uuid; v_mec uuid; v_os uuid; v_os2 uuid; v_peca uuid; v_item uuid; v_tok uuid; d timestamptz; i int; r text;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  v_mec := t.usuario('mec@x.com', 'mecanico');
  perform t.login(v_dono);
  v_os := criar_os('ABC1D23', 'Joao Silva', '77999642878', 'carro', 'Gol', 2015, 85000, 'freio');

  -- ===== datas seguem o status sem sobrescrever o que já aconteceu =====
  update ordens_servico set status = 'entregue' where id = v_os;
  perform t.admin();
  update ordens_servico set entregue_em = now() - interval '30 days', concluido_em = now() - interval '31 days' where id = v_os;
  perform t.login(v_dono);
  select entregue_em into d from ordens_servico where id = v_os;
  update ordens_servico set status = 'entregue' where id = v_os;
  assert (select entregue_em from ordens_servico where id = v_os) = d, 'tocar "Entregue" de novo não muda a data da entrega';
  update ordens_servico set status = 'pronto' where id = v_os;
  assert (select entregue_em is null and concluido_em = d - interval '1 day' from ordens_servico where id = v_os), 'voltar para pronto desfaz a entrega e mantém a conclusão';
  update ordens_servico set status = 'entregue' where id = v_os;
  assert (select entregue_em > now() - interval '1 minute' from ordens_servico where id = v_os), 'nova entrega ganha data nova';
  update ordens_servico set status = 'em_servico' where id = v_os;
  assert (select concluido_em is null and entregue_em is null from ordens_servico where id = v_os), 'voltar ao serviço limpa conclusão e entrega';
  update ordens_servico set status = 'cancelada' where id = v_os;
  assert (select cancelada_em is not null from ordens_servico where id = v_os), 'cancelar registra a data';
  update ordens_servico set status = 'aguardando' where id = v_os;
  assert (select cancelada_em is null from ordens_servico where id = v_os), 'reabrir limpa a data do cancelamento';

  -- ===== estoque: cancelar devolve, reabrir baixa de novo, editar a quantidade ajusta =====
  insert into pecas_estoque(nome, qtd, custo, preco) values ('Oleo 1L', 10, 20, 40) returning id into v_peca;
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit, peca_id) values (v_os, 'peca', 'Oleo', 4, 40, v_peca) returning id into v_item;
  assert (select qtd from pecas_estoque where id = v_peca) = 6, 'lançar dá baixa';
  update os_itens set qtd = 5 where id = v_item;
  assert (select qtd from pecas_estoque where id = v_peca) = 5, 'aumentar a quantidade baixa a diferença';
  update os_itens set qtd = 2 where id = v_item;
  assert (select qtd from pecas_estoque where id = v_peca) = 8, 'diminuir a quantidade devolve a diferença';
  update ordens_servico set status = 'cancelada' where id = v_os;
  assert (select qtd from pecas_estoque where id = v_peca) = 10, 'cancelar a OS devolve as peças';
  update ordens_servico set status = 'cancelada' where id = v_os;
  assert (select qtd from pecas_estoque where id = v_peca) = 10, 'cancelar de novo não devolve duas vezes';
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit, peca_id) values (v_os, 'peca', 'Oleo', 1, 40, v_peca);
  assert (select qtd from pecas_estoque where id = v_peca) = 10, 'item lançado em OS cancelada não baixa';
  update ordens_servico set status = 'em_servico' where id = v_os;
  assert (select qtd from pecas_estoque where id = v_peca) = 7, 'reabrir baixa tudo de novo';
  update ordens_servico set status = 'cancelada' where id = v_os;
  delete from os_itens where id = v_item;
  assert (select qtd from pecas_estoque where id = v_peca) = 10, 'apagar item de OS cancelada não devolve duas vezes';
  perform ajustar_estoque(v_peca, -10);
  assert t.falha(format($q$update ordens_servico set status = 'em_servico' where id = %L$q$, v_os)) = '23514', 'sem estoque, não reabre';
  assert (select status from ordens_servico where id = v_os) = 'cancelada', 'e nada muda';
  perform ajustar_estoque(v_peca, 10);

  -- mecânico cancela: a devolução vale também (ele não mexe no estoque direto)
  update ordens_servico set status = 'em_servico' where id = v_os;
  perform t.login(v_mec);
  update ordens_servico set status = 'cancelada' where id = v_os;
  perform t.admin();
  assert (select qtd from pecas_estoque where id = v_peca) = 10, 'cancelamento pelo mecânico devolve ao estoque';

  -- ===== fila offline: não desfaz o trabalho de outra pessoa =====
  perform t.login(v_dono);
  v_os2 := criar_os('QWE4R56', 'Jose', null, 'carro', 'Hilux', 2018, 5000, 'x');
  perform t.admin();
  update os_status_hist set em = now() - interval '1 day' where os_id = v_os2; -- aberta ontem
  perform t.login(v_dono);
  r := aplicar_op(gen_random_uuid(), 'status', jsonb_build_object('os_id', v_os2, 'status', 'em_servico', 'de', 'aguardando', 'em', (now() - interval '2 hours')::text));
  assert r = 'aplicada', 'situação esperada: aplica';
  assert (select em from os_status_hist where os_id = v_os2 and para = 'em_servico') < now() - interval '1 hour', 'o histórico guarda a hora do toque, não a da sincronização';
  update ordens_servico set status = 'entregue' where id = v_os2;
  r := aplicar_op(gen_random_uuid(), 'status', jsonb_build_object('os_id', v_os2, 'status', 'em_servico', 'de', 'aguardando', 'em', now()::text));
  assert r = 'conflito', 'a OS mudou desde o toque: não aplica';
  assert (select status = 'entregue' and entregue_em is not null from ordens_servico where id = v_os2), 'a entrega feita no escritório continua valendo';
  r := aplicar_op(gen_random_uuid(), 'status', jsonb_build_object('os_id', v_os2, 'status', 'pronto', 'de', 'entregue', 'em', (now() + interval '3 days')::text));
  assert (select max(em) <= now() from os_status_hist where os_id = v_os2), 'hora no futuro vira agora';
  r := aplicar_op(gen_random_uuid(), 'status', jsonb_build_object('os_id', v_os2, 'status', 'em_servico', 'de', 'pronto', 'em', 'lixo'));
  assert r = 'aplicada', 'hora inválida é ignorada';
  r := aplicar_op(gen_random_uuid(), 'status', jsonb_build_object('os_id', v_os2, 'status', 'diagnostico'));
  assert r = 'aplicada', 'operação antiga, sem "de", segue como antes';
  assert current_setting('app.momento', true) = '', 'o momento não vaza para o resto da transação';

  -- ===== link de acompanhamento: 90 dias a partir do cancelamento =====
  perform t.admin();
  select token_publico into v_tok from ordens_servico where id = v_os;
  update ordens_servico set criado_em = now() - interval '100 days' where id = v_os;
  update ordens_servico set cancelada_em = now() - interval '1 day' where id = v_os;
  assert acompanhar_publico(v_tok) is not null, 'OS antiga cancelada ontem: o link ainda funciona';
  update ordens_servico set cancelada_em = now() - interval '91 days' where id = v_os;
  assert acompanhar_publico(v_tok) is null, 'expira 90 dias depois do cancelamento';

  -- ===== pagamentos =====
  perform t.login(v_dono);
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit) values (v_os2, 'servico', 'Revisao', 1, 300);
  insert into pagamentos(os_id, valor, forma, pago_em) values (v_os2, 100, 'pix', now() - interval '2 days');
  assert (select pago_em < now() - interval '1 day' from pagamentos where os_id = v_os2), 'data retroativa é aceita';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma,pago_em) values (%L,10,'pix',now() + interval '2 days')$q$, v_os2)) = '22023', 'data no futuro não';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma,pago_em) values (%L,10,'pix',now() - interval '2 years')$q$, v_os2)) = '22023', 'data muito antiga não';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma) values (%L,10,'pix')$q$, v_os)) = '22023', 'OS cancelada não recebe pagamento';

  -- ===== pedidos do site: só pela função, com limite =====
  perform t.anon();
  assert t.falha($q$insert into pedidos_site(tipo,mensagem) values ('guincho','x')$q$) = '42501', 'o público não grava direto na tabela';
  assert t.falha($q$select enviar_pedido_site('hack',null,null,null,'x',null)$q$) = '23514', 'tipo inválido continua barrado';
  for i in 1..3 loop
    assert enviar_pedido_site('guincho', 'Ana', '(77) 99999-1111', null, 'pneu furado', 'a' || i) = 'ok', 'pedido normal';
  end loop;
  assert enviar_pedido_site('guincho', 'Ana', '77999991111', null, 'de novo', 'a9') = 'limite', 'mais de 3 pelo mesmo telefone em 10 min';
  for i in 1..5 loop perform enviar_pedido_site('pecas', null, null, null, 'x', 'robo'); end loop;
  assert enviar_pedido_site('pecas', null, null, null, 'x', 'robo') = 'limite', 'mais de 5 pelo mesmo aparelho em 10 min';
  for i in 1..40 loop perform enviar_pedido_site('pecas', null, null, null, 'x', 'r' || i); end loop;
  assert enviar_pedido_site('orcamento', 'Bia', null, null, 'oi', 'nova') = 'limite', 'teto de 40 por hora no total';
  perform t.admin();
  assert (select count(*) from pedidos_site) = 40, 'nada além do teto foi gravado';
  assert (select telefone from pedidos_site where nome = 'Ana' limit 1) = '77999991111', 'telefone guardado só com números';

  -- equipe logada ainda registra pedido manualmente
  delete from pedidos_site;
  perform t.login(v_mec);
  insert into pedidos_site(tipo, mensagem) values ('pecas', 'balcão');
  perform t.anon();
  assert t.falha('select * from pedidos_site') = '42501', 'anon não lê pedidos';
end $$;
rollback;
