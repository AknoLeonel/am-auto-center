-- Fase 6: registro de erros reais do servidor (em produção o Next esconde a mensagem do navegador).
-- Só o servidor (chave de serviço) grava; só o dono lê.
create table if not exists public.erros_app (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  digest text,
  mensagem text not null check (char_length(mensagem) <= 500),
  rota text check (char_length(rota) <= 200),
  tipo text check (char_length(tipo) <= 40),
  metodo text check (char_length(metodo) <= 10),
  caminho text check (char_length(caminho) <= 200)
);
create index if not exists erros_app_criado_idx on public.erros_app (criado_em desc);
create index if not exists erros_app_digest_idx on public.erros_app (digest);

alter table public.erros_app enable row level security;
do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'erros_app'
  loop execute format('drop policy %I on public.erros_app', r.policyname); end loop;
end $$;
create policy "dono le erros" on public.erros_app for select to authenticated using (public.papel_atual() = 'dono');
revoke all on public.erros_app from anon, authenticated;
grant select on public.erros_app to authenticated;

-- FIM: 20261011070000_fase6_erros_app.sql (se você vê esta linha no editor, colou o arquivo inteiro)
