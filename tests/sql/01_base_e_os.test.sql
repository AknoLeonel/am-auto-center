-- Fase 0 e 1: usuários, RLS básico, criar_os, listar_os, pedidos do site e fotos.
begin;
do $$
declare v_dono uuid; v_mec uuid; v_novo uuid; v_os uuid; v_os2 uuid; n int; r record;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  assert (select papel = 'dono' and ativo from perfis where user_id = v_dono), 'quem existia antes da migration vira dono ativo';

  v_mec := t.usuario('mec@x.com', 'mecanico', true);
  -- conta nova (cadastro público do Supabase Auth) nasce BLOQUEADA
  insert into auth.users(email) values ('intruso@x.com') returning id into v_novo;
  assert (select not ativo from perfis where user_id = v_novo), 'conta nova entra inativa';

  -- ===== intruso: nada de dados, não se auto-ativa =====
  perform t.login(v_dono);
  v_os := criar_os('ABC1D23', 'Joao Silva', '77999642878', 'carro', 'Gol', 2015, 85000, 'barulho no freio');
  perform t.login(v_novo);
  assert papel_atual() is null, 'inativo não tem papel';
  assert (select count(*) from clientes) = 0 and (select count(*) from ordens_servico) = 0 and (select count(*) from pedidos_site) = 0, 'inativo não lê nada';
  assert t.falha($q$select criar_os('ZZZ9Z99','X',null,null,null,null,null,null)$q$) = '42501', 'inativo não cria OS';
  update perfis set ativo = true, papel = 'dono' where user_id = v_novo;
  assert (select not ativo from perfis where user_id = v_novo), 'inativo não consegue se auto-ativar';
  assert (select count(*) from listar_os(null, 'todas', 20, null)) = 0, 'inativo não lista OS';
  -- o dono libera e passa a funcionar
  perform t.login(v_dono);
  update perfis set ativo = true, papel = 'mecanico' where user_id = v_novo;
  perform t.login(v_novo);
  assert (select count(*) from ordens_servico) = 1, 'depois de liberado, enxerga as OS';

  -- ===== perfis: cada um vê o seu; o dono vê todos =====
  perform t.login(v_mec);
  assert (select count(*) from perfis) = 1, 'mecânico vê só o próprio perfil';
  perform t.login(v_dono);
  assert (select count(*) from perfis) >= 3, 'dono vê todos os perfis';
  perform t.anon();
  assert t.falha('select * from perfis') = '42501', 'anon não lê perfis';

  -- ===== criar_os =====
  perform t.login(v_dono);
  assert (select count(*) from clientes) = 1 and (select count(*) from veiculos) = 1, 'criar_os cria cliente e veículo';
  v_os2 := criar_os('ABC1D23', null, null, null, null, null, 86000, 'revisão');
  assert (select count(*) from clientes) = 1 and (select count(*) from ordens_servico) = 2, 'mesma placa reaproveita cliente e veículo';
  assert (select km from veiculos) = 86000, 'km do veículo é atualizado';
  assert t.falha($q$select criar_os('ZZZ9Z99',' ',null,null,null,null,null,null)$q$) = '22023', 'placa nova sem nome é recusada';
  assert (select count(*) from clientes) = 1, 'a falha não deixa cliente solto (transação)';
  assert (select numero from ordens_servico where id = v_os) <> (select numero from ordens_servico where id = v_os2), 'cada OS tem número próprio';

  -- ===== listar_os =====
  assert (select count(*) from listar_os('abc-1d', 'abertas', 20, null)) = 2, 'busca por parte da placa';
  assert (select count(*) from listar_os('joao', 'todas', 20, null)) = 2, 'busca por cliente';
  assert (select count(*) from listar_os('gol', 'todas', 20, null)) = 2, 'busca por modelo';
  assert (select count(*) from listar_os('xyz', 'todas', 20, null)) = 0, 'busca sem resultado';
  assert exists (select 1 from listar_os((select numero::text from ordens_servico where id = v_os), 'todas', 20, null) l where l.id = v_os), 'busca pelo número da OS acha a OS';
  assert (select count(*) from listar_os('%', 'todas', 20, null)) = 0, 'o % digitado não vira curinga';
  update ordens_servico set status = 'entregue' where id = v_os;
  assert (select count(*) from listar_os(null, 'abertas', 20, null)) = 1, 'abertas esconde as entregues';
  assert (select count(*) from listar_os(null, 'entregue', 20, null)) = 1, 'filtro por situação';
  -- numa transação só, as duas OS teriam o mesmo now(); no uso real cada OS nasce na própria transação
  perform t.admin(); update ordens_servico set criado_em = now() - interval '1 hour' where id = v_os; perform t.login(v_dono);
  select criado_em into r from ordens_servico order by criado_em desc limit 1;
  assert (select count(*) from listar_os(null, 'todas', 20, r.criado_em)) = 1 and (select id from listar_os(null, 'todas', 20, r.criado_em)) = v_os, 'paginação por cursor traz só as mais antigas';
  assert (select count(*) from listar_os(null, 'todas', 1, null)) = 1, 'limite respeitado';

  -- ===== pedidos do site: o público só insere, e sempre como novo =====
  perform t.anon();
  insert into pedidos_site(tipo, mensagem) values ('pecas', 'quero pastilha');
  assert t.falha($q$insert into pedidos_site(tipo,mensagem,status) values ('pecas','x','concluido')$q$) = '42501', 'anon não escolhe o status';
  assert t.falha($q$insert into pedidos_site(tipo,mensagem) values ('hack','x')$q$) = '23514', 'tipo inválido';
  assert t.falha($q$insert into pedidos_site(tipo,mensagem) values ('pecas', repeat('x', 1801))$q$) = '23514', 'mensagem gigante';
  assert t.falha('select count(*) from pedidos_site') = '42501', 'anon não lê pedidos';
  assert t.falha('select * from ordens_servico') = '42501' and t.falha('select * from clientes') = '42501', 'anon não lê dados internos';

  -- ===== equipe: mecânico apaga? não; dono/atendente sim =====
  perform t.login(v_mec);
  delete from ordens_servico where id = v_os2;
  assert exists (select 1 from ordens_servico where id = v_os2), 'mecânico não apaga OS';

  -- ===== fotos =====
  perform t.admin();
  assert exists (select 1 from storage.buckets where id = 'os-fotos' and not public), 'bucket de fotos privado existe';
  perform t.login(v_mec);
  insert into os_fotos(os_id, caminho) values (v_os, v_os || '/a.jpg');
  assert t.falha(format($q$insert into os_fotos(os_id,caminho) values (%L, %L)$q$, v_os, v_os || '/a.jpg')) = '23505', 'caminho de foto é único';
end $$;
rollback;
