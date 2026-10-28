-- Correções da revisão de outubro: datas de status, estoque no cancelamento, fila offline sem atropelar,
-- limites para o site público, regras de pagamento e validade do link de acompanhamento.

-- ============ Momento da ação ============
-- Normalmente é now(). A fila offline informa a hora em que a pessoa tocou no botão (veja aplicar_op).
create or replace function public.momento_acao() returns timestamptz
language sql stable set search_path = '' as $$
  select coalesce(nullif(current_setting('app.momento', true), '')::timestamptz, now())
$$;

-- ============ Datas da OS seguem o status, sem sobrescrever o que já aconteceu ============
alter table public.ordens_servico add column if not exists cancelada_em timestamptz;

-- Só age quando o status muda e a data não foi informada na mesma alteração.
-- Tocar "Entregue" de novo, ou ir de "Entregue" para "Pronto" e voltar, não muda a data da entrega
-- (nem a receita do mês, nem o início da garantia).
create or replace function public.os_datas_status() returns trigger
language plpgsql set search_path = '' as $$
declare m timestamptz := public.momento_acao();
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status in ('pronto', 'entregue') then
    if new.concluido_em is not distinct from old.concluido_em then new.concluido_em := coalesce(old.concluido_em, m); end if;
  elsif new.concluido_em is not distinct from old.concluido_em then
    new.concluido_em := null;
  end if;
  if new.entregue_em is not distinct from old.entregue_em then
    new.entregue_em := case when new.status = 'entregue' then coalesce(old.entregue_em, m) end;
  end if;
  if new.cancelada_em is not distinct from old.cancelada_em then
    new.cancelada_em := case when new.status = 'cancelada' then coalesce(old.cancelada_em, m) end;
  end if;
  return new;
end $$;
revoke all on function public.os_datas_status() from public, anon, authenticated;
drop trigger if exists os_datas_status_trg on public.ordens_servico;
create trigger os_datas_status_trg before update of status on public.ordens_servico
  for each row execute function public.os_datas_status();

-- O histórico usa o mesmo momento (para a fila offline, a hora real da ação).
create or replace function public.os_status_log() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.os_status_hist (os_id, de, para, por, em) values (new.id, null, new.status, (select auth.uid()), public.momento_acao());
  elsif new.status is distinct from old.status then
    insert into public.os_status_hist (os_id, de, para, por, em) values (new.id, old.status, new.status, (select auth.uid()), public.momento_acao());
  end if;
  return null;
end $$;
revoke all on function public.os_status_log() from public, anon, authenticated;

-- OS já canceladas: a data vem do histórico (ou de agora, para não expirar o link de imediato).
update public.ordens_servico o set cancelada_em = coalesce(
    (select max(h.em) from public.os_status_hist h where h.os_id = o.id and h.para = 'cancelada'), now())
  where o.status = 'cancelada' and o.cancelada_em is null;

-- ============ Estoque: cancelar a OS devolve as peças; reabrir baixa de novo ============
-- estoque_baixado diz se a quantidade do item está fora do estoque agora.
-- Itens antigos com peça já tinham dado baixa: a coluna nasce "true" e depois o padrão vira "false".
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'os_itens' and column_name = 'estoque_baixado') then
    alter table public.os_itens add column estoque_baixado boolean not null default true;
    alter table public.os_itens alter column estoque_baixado set default false;
  end if;
end $$;

create or replace function public.os_itens_estoque() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.papel_atual() is null then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.estoque_baixado := new.peca_id is not null
      and not exists (select 1 from public.ordens_servico where id = new.os_id and status = 'cancelada');
    if new.estoque_baixado then
      update public.pecas_estoque set qtd = qtd - new.qtd where id = new.peca_id returning custo into new.custo_unit;
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    -- devolve o que estava baixado e baixa o que vale agora (quantidade, peça ou cancelamento mudaram)
    if old.estoque_baixado and old.peca_id is not null then
      update public.pecas_estoque set qtd = qtd + old.qtd where id = old.peca_id;
    end if;
    new.estoque_baixado := new.estoque_baixado and new.peca_id is not null;
    if new.estoque_baixado then
      if new.peca_id is distinct from old.peca_id then
        update public.pecas_estoque set qtd = qtd - new.qtd where id = new.peca_id returning custo into new.custo_unit;
      else
        update public.pecas_estoque set qtd = qtd - new.qtd where id = new.peca_id;
      end if;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.estoque_baixado and old.peca_id is not null then
      update public.pecas_estoque set qtd = qtd + old.qtd where id = old.peca_id;
    end if;
    return old;
  end if;
  return new;
end $$;
drop trigger if exists os_itens_estoque_upd on public.os_itens;
create trigger os_itens_estoque_upd before update of qtd, peca_id, estoque_baixado on public.os_itens
  for each row when (old.qtd is distinct from new.qtd or old.peca_id is distinct from new.peca_id
                     or old.estoque_baixado is distinct from new.estoque_baixado)
  execute function public.os_itens_estoque();

create or replace function public.os_cancelamento_estoque() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'cancelada' and old.status <> 'cancelada' then
    update public.os_itens set estoque_baixado = false where os_id = new.id and estoque_baixado;
  elsif old.status = 'cancelada' and new.status <> 'cancelada' then
    -- sem estoque suficiente, a reabertura falha com 23514 e nada muda
    update public.os_itens set estoque_baixado = true where os_id = new.id and peca_id is not null and not estoque_baixado;
  end if;
  return null;
end $$;
revoke all on function public.os_cancelamento_estoque() from public, anon, authenticated;
drop trigger if exists os_cancelamento_estoque_trg on public.ordens_servico;
create trigger os_cancelamento_estoque_trg after update of status on public.ordens_servico
  for each row when (old.status is distinct from new.status) execute function public.os_cancelamento_estoque();

-- ============ Fila offline: não desfaz o trabalho de outra pessoa ============
-- A operação de status leva "de" (a situação que o aparelho via) e "em" (a hora do toque).
-- Se a OS mudou nesse meio-tempo, devolve 'conflito' e não aplica. Operações antigas, sem "de", seguem como antes.
create or replace function public.aplicar_op(p_id uuid, p_tipo text, p_dados jsonb) returns text
language plpgsql security invoker set search_path = '' as $$
declare v_os uuid := (p_dados ->> 'os_id')::uuid; v_status text; v_atual text; v_em timestamptz; v_ult timestamptz;
begin
  if public.papel_atual() is null then raise exception 'Sem permissão' using errcode = '42501'; end if;
  insert into public.fila_ops (id, tipo) values (p_id, p_tipo) on conflict (id) do nothing;
  if not found then return 'duplicada'; end if;

  if p_tipo = 'status' then
    v_status := p_dados ->> 'status';
    select status into v_atual from public.ordens_servico where id = v_os for update;
    if not found then raise exception 'Ordem não encontrada' using errcode = 'P0002'; end if;
    if v_atual = v_status then return 'aplicada'; end if;
    if p_dados ? 'de' and p_dados ->> 'de' is distinct from v_atual then return 'conflito'; end if;
    -- hora do toque: nunca no futuro, no máximo 7 dias atrás e nunca antes da última etapa registrada
    begin v_em := (p_dados ->> 'em')::timestamptz; exception when others then v_em := null; end;
    if v_em is not null then
      select max(em) into v_ult from public.os_status_hist where os_id = v_os;
      v_em := greatest(least(v_em, now()), now() - interval '7 days', coalesce(v_ult, '-infinity'));
      perform set_config('app.momento', v_em::text, true);
    end if;
    update public.ordens_servico set status = v_status where id = v_os;
    perform set_config('app.momento', '', true);
  elsif p_tipo = 'obs' then
    update public.ordens_servico set observacoes = nullif(left(trim(coalesce(p_dados ->> 'obs', '')), 2000), '') where id = v_os;
    if not found then raise exception 'Ordem não encontrada' using errcode = 'P0002'; end if;
  elsif p_tipo = 'item' then
    insert into public.os_itens (os_id, tipo, descricao, qtd, valor_unit, peca_id)
    values (v_os, p_dados ->> 'tipo', left(trim(p_dados ->> 'descricao'), 200),
            coalesce((p_dados ->> 'qtd')::numeric, 1), coalesce((p_dados ->> 'valor')::numeric, 0),
            nullif(p_dados ->> 'peca_id', '')::uuid);
  elsif p_tipo = 'foto' then
    if (p_dados ->> 'caminho') not like v_os::text || '/%' then
      raise exception 'Caminho de foto inválido' using errcode = '22023';
    end if;
    insert into public.os_fotos (os_id, caminho) values (v_os, p_dados ->> 'caminho') on conflict (caminho) do nothing;
  else
    raise exception 'Operação desconhecida' using errcode = '22023';
  end if;
  return 'aplicada';
end $$;
revoke all on function public.aplicar_op(uuid, text, jsonb) from public, anon;
grant execute on function public.aplicar_op(uuid, text, jsonb) to authenticated;

-- ============ Link de acompanhamento: 90 dias depois da entrega ou do cancelamento ============
create or replace function public.acompanhar_publico(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'numero', o.numero, 'placa', v.placa, 'modelo', v.modelo, 'ano', v.ano,
    'cliente', split_part(c.nome, ' ', 1),
    'status', o.status, 'criado_em', o.criado_em, 'entregue_em', o.entregue_em, 'garantia_dias', o.garantia_dias,
    'etapas', (select coalesce(jsonb_agg(jsonb_build_object('status', h.para, 'em', h.em) order by h.em, h.id), '[]'::jsonb)
               from public.os_status_hist h where h.os_id = o.id),
    'orcamento_token', (select q.token from public.orcamentos q
                        where q.os_id = o.id and q.status = 'pendente' order by q.criado_em desc limit 1)
  )
  from public.ordens_servico o
  join public.veiculos v on v.id = o.veiculo_id
  join public.clientes c on c.id = o.cliente_id
  where o.token_publico = p_token
    and (o.status not in ('entregue', 'cancelada')
         or coalesce(case when o.status = 'cancelada' then o.cancelada_em else o.entregue_em end,
                     o.concluido_em, o.criado_em) > now() - interval '90 days')
$$;
revoke all on function public.acompanhar_publico(uuid) from public;
grant execute on function public.acompanhar_publico(uuid) to anon, authenticated;

-- ============ Pagamentos ============
-- Data retroativa é permitida (Pix de sábado lançado na segunda), mas não no futuro nem há mais de um ano.
-- OS cancelada não recebe pagamento.
create or replace function public.pagamentos_regras() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.pago_em > now() + interval '10 minutes' then
    raise exception 'A data do pagamento não pode ser no futuro' using errcode = '22023';
  end if;
  if new.pago_em < now() - interval '1 year' then
    raise exception 'Data do pagamento muito antiga' using errcode = '22023';
  end if;
  if exists (select 1 from public.ordens_servico where id = new.os_id and status = 'cancelada') then
    raise exception 'Ordem cancelada não recebe pagamento' using errcode = '22023';
  end if;
  return new;
end $$;
revoke all on function public.pagamentos_regras() from public, anon, authenticated;
drop trigger if exists pagamentos_regras_trg on public.pagamentos;
create trigger pagamentos_regras_trg before insert on public.pagamentos
  for each row execute function public.pagamentos_regras();

-- ============ Site público: pedidos e eventos só por função, com limite ============
-- "visitante" é um resumo (hash) do aparelho que muda todo dia: serve para limitar abusos, não identifica ninguém.
alter table public.pedidos_site add column if not exists visitante text check (char_length(visitante) <= 64);
alter table public.eventos_site add column if not exists visitante text check (char_length(visitante) <= 64);
create index if not exists pedidos_criado_idx on public.pedidos_site (criado_em desc);
create index if not exists pedidos_visitante_idx on public.pedidos_site (visitante, criado_em desc) where visitante is not null;
create index if not exists eventos_visitante_idx on public.eventos_site (visitante, criado_em desc) where visitante is not null;

-- Limites: 3 pedidos por telefone e 5 por aparelho a cada 10 minutos; 40 por hora no total.
-- Passou do limite, o pedido não é gravado (o cliente segue normalmente para o WhatsApp).
create or replace function public.enviar_pedido_site(
  p_tipo text, p_nome text, p_telefone text, p_veiculo text, p_mensagem text, p_visitante text
) returns text language plpgsql security definer set search_path = '' as $$
declare v_tel text := nullif(left(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), 20), '');
begin
  if (select count(*) from public.pedidos_site where criado_em > now() - interval '1 hour') >= 40 then return 'limite'; end if;
  if v_tel is not null and (select count(*) from public.pedidos_site
      where telefone = v_tel and criado_em > now() - interval '10 minutes') >= 3 then return 'limite'; end if;
  if p_visitante is not null and (select count(*) from public.pedidos_site
      where visitante = p_visitante and criado_em > now() - interval '10 minutes') >= 5 then return 'limite'; end if;
  insert into public.pedidos_site (tipo, nome, telefone, veiculo, mensagem, visitante)
  values (p_tipo, nullif(left(trim(coalesce(p_nome, '')), 120), ''), v_tel,
          nullif(left(trim(coalesce(p_veiculo, '')), 120), ''), trim(p_mensagem), left(p_visitante, 64));
  return 'ok';
end $$;
revoke all on function public.enviar_pedido_site(text, text, text, text, text, text) from public;
grant execute on function public.enviar_pedido_site(text, text, text, text, text, text) to anon, authenticated;

-- Limites: 120 eventos por aparelho por hora; 3000 por hora no total.
create or replace function public.registrar_evento(
  p_evento text, p_origem text, p_pagina text, p_fonte text, p_meio text, p_campanha text, p_ref text,
  p_dispositivo text, p_visitante text
) returns text language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.eventos_site where criado_em > now() - interval '1 hour') >= 3000 then return 'limite'; end if;
  if p_visitante is not null and (select count(*) from public.eventos_site
      where visitante = p_visitante and criado_em > now() - interval '1 hour') >= 120 then return 'limite'; end if;
  insert into public.eventos_site (evento, origem, pagina, fonte, meio, campanha, ref, dispositivo, visitante)
  values (p_evento, p_origem, p_pagina, p_fonte, p_meio, p_campanha, p_ref, p_dispositivo, left(p_visitante, 64));
  return 'ok';
end $$;
revoke all on function public.registrar_evento(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.registrar_evento(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- O público não grava mais direto nas tabelas (a chave pública do site não serve para inundar o painel).
drop policy if exists "publico envia pedido" on public.pedidos_site;
drop policy if exists "equipe envia pedido" on public.pedidos_site;
create policy "equipe envia pedido" on public.pedidos_site for insert to authenticated
  with check (status = 'novo' and public.papel_atual() is not null);
revoke insert on public.pedidos_site from anon;
drop policy if exists "publico registra evento" on public.eventos_site;
revoke insert on public.eventos_site from anon, authenticated;

-- FIM: 20261028000000_correcoes_revisao.sql (se você vê esta linha no editor, colou o arquivo inteiro)
