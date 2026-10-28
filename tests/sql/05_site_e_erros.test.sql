-- Fase 5 e 6: conversões do site (sem cookies) e registro de erros do servidor.
begin;
do $$
declare v_dono uuid; v_aten uuid; v_mec uuid; r jsonb;
begin
  select user_id into v_dono from perfis p join auth.users u on u.id = p.user_id where u.email = 'dono@x.com';
  v_aten := t.usuario('aten@x.com', 'atendente'); v_mec := t.usuario('mec@x.com', 'mecanico');

  -- ===== eventos do site: o visitante só registra, pela função com limite =====
  perform t.anon();
  perform registrar_evento('visita', null, '/', 'instagram', null, null, null, 'mobile', 'v1');
  perform registrar_evento('visita', null, '/servicos/freios', null, null, null, null, 'mobile', 'v1');
  perform registrar_evento('whatsapp', 'hero', '/', 'instagram', null, null, null, 'mobile', 'v1');
  perform registrar_evento('whatsapp', 'servico:freios', '/servicos/freios', null, null, null, null, 'desktop', 'v2');
  perform registrar_evento('mapa', 'local', '/', null, null, null, null, 'desktop', 'v2');
  perform registrar_evento('visita', null, '/', null, null, null, 'google.com', 'desktop', null);
  assert t.falha('select count(*) from eventos_site') = '42501', 'o visitante não lê os eventos';
  assert t.falha($q$insert into eventos_site(evento,pagina) values ('visita','/')$q$) = '42501', 'o visitante não grava direto na tabela';
  assert t.falha($q$select registrar_evento('hack',null,'/',null,null,null,null,null,null)$q$) = '23514', 'evento desconhecido';
  assert t.falha($q$select registrar_evento('visita',null,'http://evil',null,null,null,null,null,null)$q$) = '23514', 'página precisa começar com /';
  assert t.falha($q$select registrar_evento('visita',repeat('x',200),'/',null,null,null,null,null,null)$q$) = '23514', 'origem gigante';
  assert t.falha('select resumo_site(current_date - 7, current_date)') = '42501', 'o visitante não vê o resumo';

  perform t.login(v_mec);
  assert (select count(*) from eventos_site) = 0, 'mecânico não lê eventos';
  assert t.falha('select resumo_site(current_date - 7, current_date)') = '42501', 'mecânico não vê o resumo';
  perform t.login(v_aten);
  assert (select count(*) from eventos_site) = 6, 'atendente lê os eventos';
  assert t.falha('delete from eventos_site') = '42501', 'ninguém apaga pelo app';
  r := resumo_site(current_date - 1, current_date);
  assert (r->>'visitas')::int = 3 and (r->>'whatsapp')::int = 2 and (r->>'mapa')::int = 1, 'totais do período';
  assert jsonb_array_length(r->'por_dia') = 2, 'um item por dia do período';
  assert (select (x->>'cliques')::int from jsonb_array_elements(r->'por_origem') x where x->>'origem' = 'hero') = 1, 'cliques por origem';
  assert exists (select 1 from jsonb_array_elements(r->'por_fonte') x where x->>'fonte' = 'google.com'), 'a fonte vem do site de origem quando não há UTM';
  assert exists (select 1 from jsonb_array_elements(r->'por_fonte') x where x->>'fonte' = 'direto'), 'sem fonte nenhuma vira "direto"';
  assert t.falha('select resumo_site(current_date, current_date - 1)') = '22023', 'período invertido';

  -- ===== erros do servidor: só o dono lê; ninguém grava pelo app =====
  perform t.admin();
  insert into erros_app(digest, mensagem, rota, tipo, metodo, caminho) values ('123', 'function public.listar_os does not exist', '/painel', 'render', 'GET', '/painel');
  assert t.falha($q$insert into erros_app(mensagem) values (repeat('x', 501))$q$) = '23514', 'mensagem tem limite de tamanho';
  perform t.login(v_dono);
  assert (select count(*) from erros_app) = 1, 'dono lê os erros';
  assert t.falha($q$insert into erros_app(mensagem) values ('x')$q$) = '42501', 'nem o dono grava pelo app (só o servidor)';
  perform t.login(v_aten);
  assert (select count(*) from erros_app) = 0, 'atendente não lê os erros';
  perform t.anon();
  assert t.falha('select * from erros_app') = '42501', 'anon não lê os erros';
end $$;
rollback;
