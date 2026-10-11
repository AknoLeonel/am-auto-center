-- Fase 3: auditoria, histórico de status, pagamentos, visão financeira e dashboard do dono.

-- ============ Auditoria (imutável: só triggers gravam, só o dono lê) ============
create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  em timestamptz not null default now(),
  user_id uuid,
  tabela text not null,
  registro_id text not null,
  acao text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  antes jsonb,
  depois jsonb
);
create index if not exists auditoria_em_idx on public.auditoria (em desc);
create index if not exists auditoria_registro_idx on public.auditoria (tabela, registro_id, em desc);

-- Em UPDATE guarda só os campos que mudaram; atualizações sem mudança real não geram registro.
create or replace function public.auditar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_antes jsonb; v_depois jsonb;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
  else
    v_old := to_jsonb(old); v_new := to_jsonb(new);
    select coalesce(jsonb_object_agg(k.key, v_old -> k.key), '{}'::jsonb),
           coalesce(jsonb_object_agg(k.key, v_new -> k.key), '{}'::jsonb)
      into v_antes, v_depois
      from jsonb_object_keys(v_new) as k(key) where v_new -> k.key is distinct from v_old -> k.key;
    if v_antes = '{}'::jsonb then return null; end if;
  end if;
  insert into public.auditoria (user_id, tabela, registro_id, acao, antes, depois)
  values ((select auth.uid()), tg_table_name, coalesce(v_new ->> 'id', v_old ->> 'id'), tg_op,
          case when tg_op = 'UPDATE' then v_antes else v_old end,
          case when tg_op = 'UPDATE' then v_depois else v_new end);
  return null;
end $$;
revoke all on function public.auditar() from public, anon, authenticated;

-- ============ Pagamentos ============
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete restrict,
  valor numeric not null check (valor > 0 and valor <= 10000000),
  forma text not null check (forma in ('pix', 'dinheiro', 'debito', 'credito', 'transferencia')),
  pago_em timestamptz not null default now(),
  obs text check (char_length(obs) <= 200),
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create index if not exists pagamentos_os_idx on public.pagamentos (os_id);
create index if not exists pagamentos_pago_em_idx on public.pagamentos (pago_em);

-- Auditoria nas tabelas de negócio
do $$ declare t text; begin
  foreach t in array array['clientes', 'veiculos', 'ordens_servico', 'os_itens', 'pecas_estoque', 'orcamentos', 'pagamentos', 'agendamentos'] loop
    execute format('drop trigger if exists auditoria_trg on public.%I', t);
    execute format('create trigger auditoria_trg after insert or update or delete on public.%I for each row execute function public.auditar()', t);
  end loop;
end $$;

-- ============ Histórico de status ============
create table if not exists public.os_status_hist (
  id bigint generated always as identity primary key,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  de text,
  para text not null,
  por uuid,
  em timestamptz not null default now()
);
create index if not exists os_status_hist_os_idx on public.os_status_hist (os_id, em, id);

create or replace function public.os_status_log() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.os_status_hist (os_id, de, para, por) values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.os_status_hist (os_id, de, para, por) values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return null;
end $$;
revoke all on function public.os_status_log() from public, anon, authenticated;
drop trigger if exists os_status_log_trg on public.ordens_servico;
create trigger os_status_log_trg after insert or update of status on public.ordens_servico
  for each row execute function public.os_status_log();

-- OS anteriores à migration: reconstrução aproximada (a data da mudança real não existia).
insert into public.os_status_hist (os_id, de, para, em)
  select o.id, null, 'aguardando', o.criado_em from public.ordens_servico o
  where not exists (select 1 from public.os_status_hist h where h.os_id = o.id);
insert into public.os_status_hist (os_id, de, para, em)
  select o.id, 'aguardando', o.status, coalesce(o.entregue_em, o.concluido_em, o.criado_em) from public.ordens_servico o
  where o.status <> 'aguardando'
    and not exists (select 1 from public.os_status_hist h where h.os_id = o.id and h.de is not null);

-- Tempo em cada etapa: cada linha vai até a mudança seguinte (fim nulo = etapa atual).
create or replace view public.os_etapas with (security_invoker = true) as
select h.os_id, h.para as etapa, h.em as inicio,
       lead(h.em) over (partition by h.os_id order by h.em, h.id) as fim
from public.os_status_hist h;

-- ============ Visão financeira por OS ============
-- custo = só peças vindas do estoque (peça avulsa não tem custo conhecido).
create or replace view public.os_financeiro with (security_invoker = true) as
select o.id, o.numero, o.status, o.cliente_id, o.veiculo_id, o.mecanico_id,
       o.criado_em, o.concluido_em, o.entregue_em,
       c.nome as cliente_nome, c.telefone as cliente_telefone, v.placa, v.modelo,
       coalesce(i.total, 0) as total, coalesce(i.custo, 0) as custo, coalesce(p.pago, 0) as pago,
       coalesce(i.total, 0) - coalesce(p.pago, 0) as saldo
from public.ordens_servico o
join public.clientes c on c.id = o.cliente_id
join public.veiculos v on v.id = o.veiculo_id
left join lateral (
  select sum(qtd * valor_unit) as total,
         sum(case when peca_id is not null then qtd * custo_unit else 0 end) as custo
  from public.os_itens where os_id = o.id) i on true
left join lateral (select sum(valor) as pago from public.pagamentos where os_id = o.id) p on true;

-- ============ Dashboard do dono ============
create or replace function public.dashboard(p_ini date, p_fim date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare r jsonb;
begin
  if public.papel_atual() is distinct from 'dono' then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  if p_fim < p_ini or p_fim - p_ini > 366 then
    raise exception 'Período inválido' using errcode = '22023';
  end if;

  with
  ent as (
    select * from public.os_financeiro f
    where f.status = 'entregue' and f.entregue_em is not null
      and (f.entregue_em at time zone 'America/Bahia')::date between p_ini and p_fim
  ),
  res as (
    select count(*) as n, coalesce(sum(total), 0) as receita, coalesce(sum(custo), 0) as custo,
           avg(extract(epoch from entregue_em - criado_em) / 3600) as horas
    from ent
  ),
  serie as (
    select d::date as dia, coalesce(sum(e.total), 0) as receita, count(e.id) as os
    from generate_series(p_ini::timestamp, p_fim::timestamp, interval '1 day') as d
    left join ent e on (e.entregue_em at time zone 'America/Bahia')::date = d::date
    group by d
  ),
  pg as (
    select forma, valor from public.pagamentos
    where (pago_em at time zone 'America/Bahia')::date between p_ini and p_fim
  ),
  orc as (
    select status from public.orcamentos
    where status in ('aprovado', 'recusado') and (respondido_em at time zone 'America/Bahia')::date between p_ini and p_fim
  )
  select jsonb_build_object(
    'os_entregues', res.n,
    'receita', res.receita,
    'custo', res.custo,
    'margem', res.receita - res.custo,
    'ticket_medio', case when res.n > 0 then res.receita / res.n else 0 end,
    'horas_medias', res.horas,
    'recebido', (select coalesce(sum(valor), 0) from pg),
    'a_receber', (select coalesce(sum(saldo), 0) from public.os_financeiro where status in ('pronto', 'entregue') and saldo > 0),
    'orcamentos_aprovados', (select count(*) from orc where status = 'aprovado'),
    'orcamentos_recusados', (select count(*) from orc where status = 'recusado'),
    'clientes_retorno', (
      select count(distinct e.cliente_id) from ent e
      where exists (select 1 from public.ordens_servico o2
                    where o2.cliente_id = e.cliente_id and o2.status = 'entregue'
                      and o2.entregue_em < (p_ini::timestamp at time zone 'America/Bahia'))),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'receita', receita, 'os', os) order by dia), '[]'::jsonb) from serie),
    'por_forma', (select coalesce(jsonb_agg(jsonb_build_object('forma', forma, 'valor', valor) order by valor desc), '[]'::jsonb)
                  from (select forma, sum(valor) as valor from pg group by forma) t),
    'top_servicos', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'qtd', qtd, 'receita', receita) order by receita desc), '[]'::jsonb)
                     from (select min(i.descricao) as nome, sum(i.qtd) as qtd, sum(i.qtd * i.valor_unit) as receita
                           from public.os_itens i join ent e on e.id = i.os_id
                           group by lower(trim(i.descricao)) order by sum(i.qtd * i.valor_unit) desc limit 6) t),
    'por_mecanico', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'os', n, 'receita', receita) order by receita desc), '[]'::jsonb)
                     from (select coalesce(p.nome, 'Sem responsável') as nome, count(*) as n, sum(e.total) as receita
                           from ent e left join public.perfis p on p.user_id = e.mecanico_id group by 1) t),
    'etapas', (select coalesce(jsonb_agg(jsonb_build_object('etapa', etapa, 'horas', horas, 'n', n)), '[]'::jsonb)
               from (select et.etapa, avg(extract(epoch from et.fim - et.inicio) / 3600) as horas, count(*) as n
                     from public.os_etapas et join ent e on e.id = et.os_id
                     where et.fim is not null group by et.etapa) t)
  ) into r from res;
  return r;
end $$;
revoke all on function public.dashboard(date, date) from public, anon;
grant execute on function public.dashboard(date, date) to authenticated;

-- ============ RLS e privilégios ============
alter table public.auditoria enable row level security;
alter table public.pagamentos enable row level security;
alter table public.os_status_hist enable row level security;

do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and tablename in ('auditoria', 'pagamentos', 'os_status_hist')
  loop execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

create policy "dono le auditoria" on public.auditoria for select to authenticated using (public.papel_atual() = 'dono');
create policy "equipe le historico" on public.os_status_hist for select to authenticated using (public.papel_atual() is not null);
create policy "gestao le pagamentos" on public.pagamentos for select to authenticated using (public.papel_atual() in ('dono', 'atendente'));
create policy "gestao registra pagamento" on public.pagamentos for insert to authenticated with check (public.papel_atual() in ('dono', 'atendente'));
create policy "dono estorna pagamento" on public.pagamentos for delete to authenticated using (public.papel_atual() = 'dono');

revoke all on public.auditoria, public.pagamentos, public.os_status_hist, public.os_etapas, public.os_financeiro from anon;
revoke all on public.auditoria, public.os_status_hist, public.os_etapas, public.os_financeiro from authenticated;
grant select on public.auditoria, public.os_status_hist, public.os_etapas, public.os_financeiro to authenticated;
revoke all on public.pagamentos from authenticated;
grant select, insert, delete on public.pagamentos to authenticated;
