-- Fase 5: conversões do site público, sem cookies e sem dados pessoais.
create table if not exists public.eventos_site (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  evento text not null check (evento in ('visita', 'whatsapp', 'mapa', 'instagram', 'ligacao')),
  origem text check (char_length(origem) <= 60),
  pagina text not null check (char_length(pagina) <= 120 and pagina like '/%'),
  fonte text check (char_length(fonte) <= 60),
  meio text check (char_length(meio) <= 60),
  campanha text check (char_length(campanha) <= 60),
  ref text check (char_length(ref) <= 80),
  dispositivo text check (dispositivo in ('mobile', 'desktop'))
);
create index if not exists eventos_site_criado_idx on public.eventos_site (criado_em desc);
create index if not exists eventos_site_evento_idx on public.eventos_site (evento, criado_em desc);

alter table public.eventos_site enable row level security;
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'eventos_site'
  loop execute format('drop policy %I on public.eventos_site', r.policyname); end loop;
end $$;
create policy "publico registra evento" on public.eventos_site for insert to anon, authenticated with check (true);
create policy "gestao le eventos" on public.eventos_site for select to authenticated using (public.papel_atual() in ('dono', 'atendente'));
revoke all on public.eventos_site from anon, authenticated;
grant insert on public.eventos_site to anon, authenticated;
grant select on public.eventos_site to authenticated;

-- Resumo para o painel (dono e atendente). Datas no horário da Bahia.
create or replace function public.resumo_site(p_ini date, p_fim date) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare r jsonb;
begin
  if public.papel_atual() not in ('dono', 'atendente') then raise exception 'Sem permissão' using errcode = '42501'; end if;
  if p_fim < p_ini or p_fim - p_ini > 366 then raise exception 'Período inválido' using errcode = '22023'; end if;
  with ev as (
    select *, (criado_em at time zone 'America/Bahia')::date as dia,
           (evento in ('whatsapp', 'ligacao', 'mapa')) as contato
    from public.eventos_site
    where (criado_em at time zone 'America/Bahia')::date between p_ini and p_fim
  )
  select jsonb_build_object(
    'visitas', (select count(*) from ev where evento = 'visita'),
    'whatsapp', (select count(*) from ev where evento = 'whatsapp'),
    'ligacao', (select count(*) from ev where evento = 'ligacao'),
    'mapa', (select count(*) from ev where evento = 'mapa'),
    'instagram', (select count(*) from ev where evento = 'instagram'),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', d::date,
                  'visitas', (select count(*) from ev where ev.dia = d::date and evento = 'visita'),
                  'contatos', (select count(*) from ev where ev.dia = d::date and contato)) order by d), '[]'::jsonb)
                from generate_series(p_ini::timestamp, p_fim::timestamp, interval '1 day') d),
    'por_origem', (select coalesce(jsonb_agg(jsonb_build_object('origem', origem, 'cliques', n) order by n desc), '[]'::jsonb)
                   from (select coalesce(origem, 'outro') as origem, count(*) as n from ev where contato group by 1 limit 12) t),
    'por_pagina', (select coalesce(jsonb_agg(jsonb_build_object('pagina', pagina, 'visitas', v, 'contatos', c) order by v desc), '[]'::jsonb)
                   from (select pagina, count(*) filter (where evento = 'visita') as v, count(*) filter (where contato) as c
                         from ev group by pagina order by 2 desc limit 12) t),
    'por_fonte', (select coalesce(jsonb_agg(jsonb_build_object('fonte', fonte, 'visitas', v, 'contatos', c) order by v desc), '[]'::jsonb)
                  from (select coalesce(fonte, nullif(ref, ''), 'direto') as fonte, count(*) filter (where evento = 'visita') as v, count(*) filter (where contato) as c
                        from ev group by 1 order by 2 desc limit 10) t),
    'por_dispositivo', (select coalesce(jsonb_agg(jsonb_build_object('dispositivo', dispositivo, 'visitas', v, 'contatos', c)), '[]'::jsonb)
                        from (select coalesce(dispositivo, 'desconhecido') as dispositivo, count(*) filter (where evento = 'visita') as v, count(*) filter (where contato) as c
                              from ev group by 1) t)
  ) into r;
  return r;
end $$;
revoke all on function public.resumo_site(date, date) from public, anon;
grant execute on function public.resumo_site(date, date) to authenticated;

-- FIM: 20261011050000_fase5_eventos_site.sql (se você vê esta linha no editor, colou o arquivo inteiro)
