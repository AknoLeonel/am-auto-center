-- Fase 2: estoque com baixa automática, checklist, orçamento digital, mecânico/garantia.
begin;
do $$
declare v_dono uuid; v_mec uuid; v_aten uuid; v_os uuid; v_peca uuid; v_tok uuid; v_tok2 uuid; j jsonb; res text;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  v_mec := t.usuario('mec@x.com', 'mecanico'); v_aten := t.usuario('aten@x.com', 'atendente');

  perform t.login(v_dono);
  v_os := criar_os('ABC1D23', 'Joao Silva', '77999642878', 'carro', 'Gol', 2015, 85000, 'freio');
  insert into pecas_estoque(nome, qtd, minimo, custo, preco) values ('Pastilha', 3, 1, 40, 90) returning id into v_peca;

  -- ===== estoque =====
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit, peca_id) values (v_os, 'peca', 'Pastilha', 2, 90, v_peca);
  assert (select qtd from pecas_estoque where id = v_peca) = 1, 'lançar a peça dá baixa no estoque';
  assert (select custo_unit from os_itens where peca_id = v_peca) = 40, 'o custo da peça fica guardado no item';
  assert t.falha(format($q$insert into os_itens(os_id,tipo,descricao,qtd,valor_unit,peca_id) values (%L,'peca','Pastilha',5,90,%L)$q$, v_os, v_peca)) = '23514', 'estoque insuficiente (23514)';
  assert (select qtd from pecas_estoque where id = v_peca) = 1, 'a falha não altera o estoque';
  delete from os_itens where peca_id = v_peca;
  assert (select qtd from pecas_estoque where id = v_peca) = 3, 'remover o item devolve ao estoque';
  perform ajustar_estoque(v_peca, 10);
  assert (select qtd from pecas_estoque where id = v_peca) = 13, 'ajuste de entrada';
  assert t.falha(format('select ajustar_estoque(%L, -100)', v_peca)) = '23514', 'ajuste não deixa o estoque negativo';

  -- ===== mecânico lança peça, mas não mexe no estoque =====
  perform t.login(v_mec);
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit, peca_id) values (v_os, 'peca', 'Pastilha', 1, 90, v_peca);
  perform t.admin();
  assert (select qtd from pecas_estoque where id = v_peca) = 12, 'baixa vale também quando é o mecânico que lança';
  perform t.login(v_mec);
  assert t.falha(format('select ajustar_estoque(%L, 5)', v_peca)) = '42501', 'mecânico não ajusta estoque';
  assert t.falha($q$insert into pecas_estoque(nome) values ('x')$q$) = '42501', 'mecânico não cadastra peça';
  assert (select count(*) from pecas_estoque) = 1, 'mas enxerga o estoque';
  perform t.login(v_aten);
  insert into pecas_estoque(nome, qtd) values ('Filtro', 5);
  assert (select count(*) from pecas_estoque) = 2, 'atendente cadastra peça';
  perform t.anon();
  assert t.falha('select * from pecas_estoque') = '42501', 'anon não vê estoque';

  -- ===== checklist atômico =====
  perform t.login(v_mec);
  perform salvar_checklist(v_os, 'entrada', array['a', 'b', 'a', '']);
  assert (select count(*) from os_checklist where os_id = v_os) = 2, 'checklist guarda itens únicos e ignora vazios';
  perform salvar_checklist(v_os, 'entrada', array['c']);
  assert (select count(*) from os_checklist where os_id = v_os) = 1, 'regravar substitui';
  assert t.falha(format($q$select salvar_checklist(%L,'x',array['a'])$q$, v_os)) = '22023', 'momento inválido';

  -- ===== orçamento digital =====
  perform t.login(v_dono);
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit) values (v_os, 'servico', 'Mão de obra', 1, 80);
  v_tok := criar_orcamento(v_os);
  assert (select status from ordens_servico where id = v_os) = 'aprovacao', 'gerar orçamento move a OS para aprovação';
  v_tok2 := criar_orcamento(v_os);
  assert (select status from orcamentos where token = v_tok) = 'substituido', 'orçamento anterior fica substituído';
  assert t.falha(format('select criar_orcamento(%L)', gen_random_uuid())) = '22023', 'sem itens não gera orçamento';

  -- cliente (anônimo) pelo link
  perform t.anon();
  j := orcamento_publico(v_tok);
  assert j->>'status' = 'substituido', 'link antigo mostra que foi substituído';
  j := orcamento_publico(v_tok2);
  assert j->>'status' = 'pendente' and j->>'cliente' = 'Joao' and (j->>'total')::numeric = 170, 'link novo: só o primeiro nome e o total certo (90 + 80)';
  assert not (j ? 'telefone') and not (j ? 'cliente_id'), 'o link não expõe telefone nem ids';
  assert orcamento_publico(gen_random_uuid()) is null, 'token inexistente não devolve nada';
  assert t.falha(format('select responder_orcamento(%L, true, %L)', v_tok2, 'a')) = '22023', 'aprovar exige nome';
  assert responder_orcamento(v_tok2, true, 'Joao da Silva') = 'aprovado', 'cliente aprova';
  assert responder_orcamento(v_tok2, false, '') = 'aprovado', 'só a primeira resposta vale';
  assert responder_orcamento(v_tok, true, 'Joao da Silva') = 'substituido', 'link antigo não aprova';
  assert t.falha('select * from orcamentos') = '42501', 'anon não lê orçamentos';
  perform t.admin();
  assert (select status from ordens_servico where id = v_os) = 'em_servico', 'aprovação leva a OS para "em serviço"';
  assert (select aceite_nome from orcamentos where token = v_tok2) = 'Joao da Silva', 'aceite registrado com nome';
  assert (select respondido_em is not null from orcamentos where token = v_tok2), 'aceite registrado com data';

  -- ===== equipe e garantia =====
  perform t.login(v_aten);
  assert (select count(*) from equipe_ativa()) >= 3, 'equipe ativa lista os usuários (sem e-mail)';
  update ordens_servico set mecanico_id = v_mec, garantia_dias = 120 where id = v_os;
  assert (select garantia_dias from ordens_servico where id = v_os) = 120, 'garantia e mecânico responsável';
  assert t.falha(format('update ordens_servico set garantia_dias = -1 where id = %L', v_os)) = '23514', 'garantia negativa é recusada';
end $$;
rollback;
