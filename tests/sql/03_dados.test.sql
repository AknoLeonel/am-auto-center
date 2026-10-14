-- Fase 3: auditoria imutável, histórico de status, pagamentos, visão financeira e dashboard.
begin;
do $$
declare v_dono uuid; v_mec uuid; v_aten uuid; v_os uuid; v_os2 uuid; d jsonb; n int;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  v_mec := t.usuario('mec@x.com', 'mecanico'); v_aten := t.usuario('aten@x.com', 'atendente');

  perform t.login(v_dono);
  v_os := criar_os('ABC1D23', 'Maria Souza', '77988887777', 'carro', 'Uno', 2012, 1000, 'óleo');
  insert into os_itens(os_id, tipo, descricao, qtd, valor_unit) values (v_os, 'servico', 'Troca de oleo', 1, 150);
  -- OS entregue há 3 dias (como se fosse antiga), para o dashboard
  perform t.admin();
  update ordens_servico set status = 'entregue', criado_em = now() - interval '5 days', entregue_em = now() - interval '3 days', concluido_em = now() - interval '3 days' where id = v_os;
  perform t.login(v_dono);

  -- ===== histórico de status =====
  assert (select count(*) from os_status_hist where os_id = v_os) >= 2, 'criação e mudança de situação ficam no histórico';
  perform t.login(v_dono);
  v_os2 := criar_os('QWE4R56', 'Jose', null, 'carro', 'Hilux', 2018, 5000, 'x');
  perform t.login(v_mec);
  update ordens_servico set status = 'diagnostico' where id = v_os2;
  perform t.login(v_dono);
  update ordens_servico set status = 'pronto' where id = v_os2;
  update ordens_servico set observacoes = null where id = v_os2; -- sem mudança de verdade
  assert (select string_agg(para, '>' order by em, id) from os_status_hist where os_id = v_os2) = 'aguardando>diagnostico>pronto', 'linha do tempo na ordem certa';
  assert (select por from os_status_hist where os_id = v_os2 and para = 'diagnostico') = v_mec, 'o histórico guarda quem mudou';
  assert (select count(*) from os_etapas where os_id = v_os2 and fim is null) = 1, 'só a etapa atual fica sem fim';

  -- ===== auditoria =====
  assert (select count(*) from auditoria where tabela = 'ordens_servico' and registro_id = v_os2::text and acao = 'UPDATE') = 2, 'update sem mudança real não gera registro';
  assert (select antes from auditoria where tabela = 'ordens_servico' and acao = 'UPDATE' and depois ? 'status' and registro_id = v_os2::text order by id desc limit 1) = '{"status": "diagnostico"}'::jsonb, 'guarda só o campo que mudou (antes)';
  assert (select depois from auditoria where tabela = 'ordens_servico' and acao = 'UPDATE' and depois ? 'status' and registro_id = v_os2::text order by id desc limit 1) = '{"status": "pronto"}'::jsonb, 'guarda só o campo que mudou (depois)';
  assert exists (select 1 from auditoria where user_id = v_mec and tabela = 'ordens_servico'), 'registra quem fez';
  assert t.falha('delete from auditoria') = '42501' and t.falha($q$update auditoria set tabela = 'x'$q$) = '42501' and t.falha($q$insert into auditoria(tabela,registro_id,acao) values ('x','1','INSERT')$q$) = '42501', 'a auditoria é imutável pelo app';
  perform t.login(v_aten);
  assert (select count(*) from auditoria) = 0, 'atendente não lê a auditoria';
  perform t.login(v_mec);
  assert (select count(*) from auditoria) = 0, 'mecânico não lê a auditoria';
  perform t.anon();
  assert t.falha('select * from auditoria') = '42501', 'anon não lê a auditoria';

  -- ===== pagamentos =====
  perform t.login(v_aten);
  insert into pagamentos(os_id, valor, forma) values (v_os, 100, 'pix');
  assert (select saldo = 50 and pago = 100 from os_financeiro where id = v_os), 'saldo = total - pagamentos';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma) values (%L,1,'fiado')$q$, v_os)) = '23514', 'forma inexistente';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma) values (%L,0,'pix')$q$, v_os)) = '23514', 'valor zero';
  delete from pagamentos;
  assert (select count(*) from pagamentos) = 1, 'atendente não estorna';
  perform t.login(v_mec);
  assert (select count(*) from pagamentos) = 0, 'mecânico não vê pagamentos';
  assert t.falha(format($q$insert into pagamentos(os_id,valor,forma) values (%L,5,'pix')$q$, v_os)) = '42501', 'mecânico não registra pagamento';
  perform t.login(v_dono);
  assert t.falha(format('delete from ordens_servico where id = %L', v_os)) = '23503', 'OS com pagamento não pode ser apagada';
  insert into pagamentos(os_id, valor, forma) values (v_os, 50, 'dinheiro');
  delete from pagamentos where forma = 'pix';
  assert (select count(*) from pagamentos) = 1, 'dono estorna';
  assert (select antes->>'valor' from auditoria where tabela = 'pagamentos' and acao = 'DELETE') = '100', 'o estorno fica na auditoria';

  -- ===== dashboard =====
  d := dashboard(current_date - 7, current_date);
  assert (d->>'os_entregues')::int = 1 and (d->>'receita')::numeric = 150, 'receita e OS entregues';
  assert (d->>'recebido')::numeric = 50, 'recebido no período';
  assert (d->>'a_receber')::numeric = 100, 'a receber = saldo das OS entregues/prontas';
  assert (d->>'ticket_medio')::numeric = 150, 'ticket médio';
  assert (d->>'horas_medias')::numeric between 47 and 49, 'tempo médio de reparo (48 h)';
  assert jsonb_array_length(d->'por_dia') = 8, 'um item por dia do período, inclusive os zerados';
  assert d->'top_servicos'->0->>'nome' = 'Troca de oleo', 'serviço mais vendido';
  assert d->'por_forma'->0->>'forma' = 'dinheiro', 'recebido por forma';
  assert t.falha('select dashboard(current_date, current_date - 1)') = '22023', 'período invertido';
  assert t.falha('select dashboard(current_date - 400, current_date)') = '22023', 'período maior que um ano';
  perform t.login(v_aten);
  assert t.falha('select dashboard(current_date - 7, current_date)') = '42501', 'atendente não vê o dashboard';
  perform t.anon();
  assert t.falha('select dashboard(current_date - 7, current_date)') = '42501', 'anon não executa o dashboard';
  assert t.falha('select * from os_financeiro') = '42501', 'anon não lê a visão financeira';
end $$;
rollback;
