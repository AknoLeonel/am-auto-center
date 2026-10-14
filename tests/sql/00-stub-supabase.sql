-- Imita o mínimo do Supabase (papéis, schemas auth/storage/extensions, auth.uid) e cria ajudantes de teste.
-- Só para o banco de teste: NUNCA rode no Supabase real.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema extensions; create schema auth; create schema storage;
grant usage on schema extensions, auth to anon, authenticated;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema public to anon, authenticated;
grant usage on schema storage to authenticated;
create publication supabase_realtime;
-- um usuário que já existe antes das migrations (vira "dono" no preenchimento inicial)
insert into auth.users(email) values ('dono@x.com');

create schema t;
grant usage on schema t to anon, authenticated;
create function t.login(p uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', p::text, true); execute 'set local role authenticated'; end $$;
create function t.anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', true); execute 'set local role anon'; end $$;
create function t.admin() returns void language plpgsql as $$ begin execute 'reset role'; end $$;
-- executa um SQL e devolve o código do erro (SQLSTATE) ou nulo se deu certo
create function t.falha(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return null; exception when others then return sqlstate; end $$;
-- cria usuário já com papel e situação (chamar como superusuário)
create function t.usuario(p_email text, p_papel text default 'mecanico', p_ativo boolean default true) returns uuid language plpgsql as $$
declare v uuid;
begin
  insert into auth.users(email) values (p_email) returning id into v;
  update public.perfis set papel = p_papel, ativo = p_ativo where user_id = v;
  return v;
end $$;
grant execute on all functions in schema t to anon, authenticated;
