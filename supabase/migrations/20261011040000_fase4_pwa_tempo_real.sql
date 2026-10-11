-- Fase 4: fila offline idempotente, push, acompanhamento público e Realtime.

-- ============ Link público de acompanhamento ============
alter table public.ordens_servico add column if not exists token_publico uuid not null default gen_random_uuid();
create unique index if not exists os_token_publico_idx on public.ordens_servico (token_publico);

-- Só o necessário para o cliente: sem valores, sem telefone, só o primeiro nome.
-- O link expira 90 dias depois da entrega (ou do cancelamento).
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
         or coalesce(o.entregue_em, o.concluido_em, o.criado_em) > now() - interval '90 days')
$$;
revoke all on function public.acompanhar_publico(uuid) from public;
grant execute on function public.acompanhar_publico(uuid) to anon, authenticated;

-- ============ Fila offline: cada operação tem um id gerado no aparelho ============
create table if not exists public.fila_ops (
  id uuid primary key,
  user_id uuid not null default auth.uid(),
  tipo text not null,
  criado_em timestamptz not null default now()
);
alter table public.fila_ops enable row level security;
drop policy if exists "ve proprias ops" on public.fila_ops;
drop policy if exists "registra propria op" on public.fila_ops;
create policy "ve proprias ops" on public.fila_ops for select to authenticated using (user_id = (select auth.uid()));
create policy "registra propria op" on public.fila_ops for insert to authenticated
  with check (user_id = (select auth.uid()) and public.papel_atual() is not null);
revoke all on public.fila_ops from anon, authenticated;
grant select, insert on public.fila_ops to authenticated;

-- Reenviar a mesma operação (rede instável, duas abas) não duplica nada: o id já registrado devolve 'duplicada'.
-- Tudo na mesma transação: se a operação falhar, o registro do id também some e dá para tentar de novo.
create or replace function public.aplicar_op(p_id uuid, p_tipo text, p_dados jsonb) returns text
language plpgsql security invoker set search_path = '' as $$
declare v_os uuid := (p_dados ->> 'os_id')::uuid; v_status text;
begin
  if public.papel_atual() is null then raise exception 'Sem permissão' using errcode = '42501'; end if;
  insert into public.fila_ops (id, tipo) values (p_id, p_tipo) on conflict (id) do nothing;
  if not found then return 'duplicada'; end if;

  if p_tipo = 'status' then
    v_status := p_dados ->> 'status';
    update public.ordens_servico set status = v_status,
      concluido_em = case when v_status in ('pronto', 'entregue') then now() else null end,
      entregue_em = case when v_status = 'entregue' then now() else null end
      where id = v_os;
    if not found then raise exception 'Ordem não encontrada' using errcode = 'P0002'; end if;
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

-- ============ Inscrições de push (uma por aparelho) ============
create table if not exists public.push_subs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) <= 1000),
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.push_subs enable row level security;
drop policy if exists "proprias inscricoes" on public.push_subs;
create policy "proprias inscricoes" on public.push_subs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.papel_atual() is not null);
revoke all on public.push_subs from anon, authenticated;
grant select, insert, delete on public.push_subs to authenticated;

-- ============ Realtime (o RLS vale: cada um só recebe o que pode ler) ============
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['ordens_servico', 'pedidos_site', 'orcamentos', 'agendamentos', 'os_itens'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- FIM: 20261011040000_fase4_pwa_tempo_real.sql (se você vê esta linha no editor, colou o arquivo inteiro)
