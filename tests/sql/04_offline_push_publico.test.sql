-- Fase 4: operações offline idempotentes, push, link público de acompanhamento e Realtime.
begin;
do $$
declare v_dono uuid; v_mec uuid; v_os uuid; v_op uuid; v_tok uuid; j jsonb; caminho text;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  v_mec := t.usuario('mec@x.com', 'mecanico');
  perform t.login(v_dono);
  v_os := criar_os('ABC1D23', 'Joao Silva', '77999642878', 'carro', 'Gol', 2015, 85000, 'freio');
  select token_publico into v_tok from ordens_servico where id = v_os;
  v_op := gen_random_uuid();

  -- ===== aplicar_op: idempotente =====
  assert aplicar_op(v_op, 'status', jsonb_build_object('os_id', v_os, 'status', 'diagnostico')) = 'aplicada', 'aplica a operação';
  assert aplicar_op(v_op, 'status', jsonb_build_object('os_id', v_os, 'status', 'pronto')) = 'duplicada', 'o mesmo id de novo: duplicada';
  assert (select status from ordens_servico where id = v_os) = 'diagnostico', 'a duplicada não muda nada';
  assert aplicar_op(gen_random_uuid(), 'item', jsonb_build_object('os_id', v_os, 'tipo', 'servico', 'descricao', ' Alinhamento ', 'qtd', '1', 'valor', '80')) = 'aplicada', 'item';
  assert (select descricao from os_itens where os_id = v_os) = 'Alinhamento', 'item é limpo (trim)';
  assert aplicar_op(gen_random_uuid(), 'obs', jsonb_build_object('os_id', v_os, 'obs', '  barulho  ')) = 'aplicada', 'observação';
  assert (select observacoes from ordens_servico where id = v_os) = 'barulho', 'observação gravada sem espaços';
  caminho := v_os || '/' || gen_random_uuid() || '.jpg';
  assert aplicar_op(gen_random_uuid(), 'foto', jsonb_build_object('os_id', v_os, 'caminho', caminho)) = 'aplicada', 'foto';
  assert aplicar_op(gen_random_uuid(), 'foto', jsonb_build_object('os_id', v_os, 'caminho', caminho)) = 'aplicada' and (select count(*) from os_fotos) = 1, 'mesma foto por outra operação não duplica';
  assert t.falha(format($q$select aplicar_op(gen_random_uuid(),'foto',jsonb_build_object('os_id',%L,'caminho','00000000-0000-0000-0000-000000000000/x.jpg'))$q$, v_os)) = '22023', 'foto fora da pasta da OS';
  -- falha não consome o id (dá para tentar de novo)
  v_op := gen_random_uuid();
  assert t.falha(format($q$select aplicar_op(%L,'status',jsonb_build_object('os_id',%L,'status','voando'))$q$, v_op, v_os)) = '23514', 'situação inválida';
  assert not exists (select 1 from fila_ops where id = v_op), 'operação que falhou não consome o id';
  assert t.falha(format($q$select aplicar_op(gen_random_uuid(),'status',jsonb_build_object('os_id',%L,'status','pronto'))$q$, gen_random_uuid())) = 'P0002', 'OS inexistente';
  assert t.falha(format($q$select aplicar_op(gen_random_uuid(),'apagar',jsonb_build_object('os_id',%L))$q$, v_os)) = '22023', 'tipo desconhecido';
  assert (select count(*) from os_status_hist where para = 'diagnostico' and os_id = v_os) = 1, 'a mudança offline entrou no histórico';

  -- ===== fila e push são por usuário =====
  perform t.login(v_mec);
  assert (select count(*) from fila_ops) = 0, 'cada um só vê as próprias operações';
  insert into push_subs(endpoint, p256dh, auth) values ('https://push/e2', 'k', 'a');
  assert (select count(*) from push_subs) = 1, 'mecânico vê só a própria inscrição';
  assert t.falha(format($q$insert into push_subs(user_id,endpoint,p256dh,auth) values (%L,'https://push/e3','k','a')$q$, v_dono)) = '42501', 'não dá para inscrever outra pessoa';
  perform t.login(v_dono);
  insert into push_subs(endpoint, p256dh, auth) values ('https://push/e1', 'k', 'a');
  assert (select count(*) from push_subs) = 1, 'dono não vê as inscrições do mecânico';
  delete from push_subs where endpoint = 'https://push/e2';
  perform t.login(v_mec);
  assert (select count(*) from push_subs) = 1, 'nem apaga as do mecânico';

  -- ===== anon =====
  perform t.anon();
  assert t.falha('select aplicar_op(gen_random_uuid(), $a$obs$a$, $a${}$a$::jsonb)') = '42501', 'anon não aplica operações';
  assert t.falha('select * from push_subs') = '42501' and t.falha('select * from fila_ops') = '42501', 'anon não lê push nem fila';

  -- ===== acompanhamento público =====
  j := acompanhar_publico(v_tok);
  assert j->>'status' = 'diagnostico' and j->>'cliente' = 'Joao' and j->>'placa' = 'ABC1D23', 'o cliente vê situação, primeiro nome e placa';
  assert not (j ? 'total') and not (j ? 'telefone') and not (j ? 'itens') and not (j ? 'observacoes') and not (j ? 'defeito'), 'sem valores, telefone, itens, observações ou defeito';
  assert jsonb_array_length(j->'etapas') = 2, 'etapas do andamento';
  assert acompanhar_publico(gen_random_uuid()) is null, 'token inválido';
  perform t.admin();
  update ordens_servico set status = 'entregue', entregue_em = now() - interval '91 days' where id = v_os;
  assert acompanhar_publico(v_tok) is null, 'o link expira 90 dias depois da entrega';
  update ordens_servico set entregue_em = now() - interval '10 days' where id = v_os;
  assert acompanhar_publico(v_tok) is not null, 'e funciona antes disso';

  -- ===== Realtime =====
  assert (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('ordens_servico', 'pedidos_site', 'orcamentos', 'agendamentos', 'os_itens')) = 5, 'as 5 tabelas estão no Realtime';
end $$;
rollback;
