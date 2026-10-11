-- Fase 1: busca/paginação no servidor, criação de OS transacional e fotos da OS.

create extension if not exists pg_trgm with schema extensions;
create index if not exists clientes_nome_trgm on public.clientes using gin (nome extensions.gin_trgm_ops);
create index if not exists veiculos_modelo_trgm on public.veiculos using gin (modelo extensions.gin_trgm_ops);

-- Lista de OS com filtro, busca e paginação por cursor (criado_em). SECURITY INVOKER: o RLS vale.
create or replace function public.listar_os(
  p_busca text default null,
  p_filtro text default 'abertas',
  p_limite int default 20,
  p_antes timestamptz default null
) returns table (
  id uuid, numero bigint, status text, defeito text, criado_em timestamptz,
  placa text, modelo text, cliente_nome text
) language sql stable security invoker set search_path = '' as $$
  with b as (
    select nullif(trim(p_busca), '') as txt,
           upper(regexp_replace(coalesce(p_busca, ''), '[^A-Za-z0-9]', '', 'g')) as placa
  )
  select o.id, o.numero, o.status, o.defeito, o.criado_em, v.placa, v.modelo, c.nome
  from public.ordens_servico o
  join public.veiculos v on v.id = o.veiculo_id
  join public.clientes c on c.id = o.cliente_id
  cross join b
  where (p_antes is null or o.criado_em < p_antes)
    and case p_filtro
          when 'todas' then true
          when 'abertas' then o.status not in ('entregue', 'cancelada')
          else o.status = p_filtro
        end
    and (b.txt is null
         or o.numero::text = b.txt
         or (b.placa <> '' and v.placa ilike '%' || b.placa || '%')
         or c.nome ilike '%' || replace(replace(b.txt, '%', ''), '_', '') || '%'
         or v.modelo ilike '%' || replace(replace(b.txt, '%', ''), '_', '') || '%')
  order by o.criado_em desc
  limit least(greatest(p_limite, 1), 100)
$$;
grant execute on function public.listar_os(text, text, int, timestamptz) to authenticated;
revoke execute on function public.listar_os(text, text, int, timestamptz) from public, anon;

-- Cria cliente + veículo + OS em uma única transação (some o "rollback manual" do app).
create or replace function public.criar_os(
  p_placa text, p_nome text, p_telefone text, p_tipo text, p_modelo text,
  p_ano int, p_km int, p_defeito text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_veic public.veiculos;
  v_cli uuid;
  v_os uuid;
begin
  if public.papel_atual() is null then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;

  select * into v_veic from public.veiculos where placa = p_placa;
  if not found then
    if coalesce(trim(p_nome), '') = '' then
      raise exception 'Informe o nome do cliente' using errcode = '22023';
    end if;
    insert into public.clientes (nome, telefone) values (trim(p_nome), nullif(p_telefone, ''))
      returning id into v_cli;
    insert into public.veiculos (cliente_id, placa, tipo, modelo, ano, km)
      values (v_cli, p_placa, coalesce(nullif(p_tipo, ''), 'carro'), nullif(trim(p_modelo), ''), p_ano, p_km)
      returning * into v_veic;
  elsif p_km is not null then
    update public.veiculos set km = p_km where id = v_veic.id;
  end if;

  insert into public.ordens_servico (cliente_id, veiculo_id, defeito, km)
    values (v_veic.cliente_id, v_veic.id, nullif(trim(p_defeito), ''), p_km)
    returning id into v_os;
  return v_os;
end $$;
grant execute on function public.criar_os(text, text, text, text, text, int, int, text) to authenticated;
revoke execute on function public.criar_os(text, text, text, text, text, int, int, text) from public, anon;

-- Fotos da OS
create table if not exists public.os_fotos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  caminho text not null unique,
  criado_em timestamptz not null default now()
);
create index if not exists os_fotos_os_idx on public.os_fotos (os_id);
alter table public.os_fotos enable row level security;

drop policy if exists "equipe le" on public.os_fotos;
drop policy if exists "equipe insere" on public.os_fotos;
drop policy if exists "gestao apaga" on public.os_fotos;
create policy "equipe le" on public.os_fotos for select to authenticated using (public.papel_atual() is not null);
create policy "equipe insere" on public.os_fotos for insert to authenticated with check (public.papel_atual() is not null);
create policy "gestao apaga" on public.os_fotos for delete to authenticated using (public.papel_atual() is not null);
revoke all on public.os_fotos from anon;
grant select, insert, delete on public.os_fotos to authenticated;

-- Bucket privado (as fotos são vistas por URL assinada)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('os-fotos', 'os-fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "equipe le fotos" on storage.objects;
drop policy if exists "equipe envia fotos" on storage.objects;
drop policy if exists "equipe apaga fotos" on storage.objects;
create policy "equipe le fotos" on storage.objects for select to authenticated
  using (bucket_id = 'os-fotos' and public.papel_atual() is not null);
create policy "equipe envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'os-fotos' and public.papel_atual() is not null);
create policy "equipe apaga fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'os-fotos' and public.papel_atual() is not null);

-- FIM: 20261011010000_fase1_os_transacional_fotos.sql (se você vê esta linha no editor, colou o arquivo inteiro)
