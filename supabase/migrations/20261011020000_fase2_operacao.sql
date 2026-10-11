-- Fase 2: orçamento digital com aprovação por link, estoque, checklist, agenda, mecânico e garantia.

-- ============ OS: mecânico responsável, garantia e entrega ============
alter table public.ordens_servico
  add column if not exists mecanico_id uuid references auth.users(id) on delete set null,
  add column if not exists garantia_dias int not null default 90,
  add column if not exists entregue_em timestamptz;
do $$ begin
  alter table public.ordens_servico add constraint os_garantia_chk check (garantia_dias between 0 and 3650);
exception when duplicate_object then null; end $$;
create index if not exists os_mecanico_idx on public.ordens_servico (mecanico_id);

-- Equipe ativa (para escolher o mecânico). Não expõe e-mails.
create or replace function public.equipe_ativa() returns table (user_id uuid, nome text, papel text)
language sql stable security definer set search_path = '' as $$
  select user_id, coalesce(nome, 'Sem nome'), papel from public.perfis
  where ativo and public.papel_atual() is not null order by nome
$$;
revoke all on function public.equipe_ativa() from public, anon;
grant execute on function public.equipe_ativa() to authenticated;

-- ============ Estoque de peças ============
create table if not exists public.pecas_estoque (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 120),
  codigo text check (char_length(codigo) <= 60),
  qtd numeric not null default 0 check (qtd >= 0),
  minimo numeric not null default 0 check (minimo >= 0),
  custo numeric not null default 0 check (custo >= 0),
  preco numeric not null default 0 check (preco >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists pecas_nome_trgm on public.pecas_estoque using gin (nome extensions.gin_trgm_ops);
create index if not exists pecas_ativo_idx on public.pecas_estoque (ativo, nome);

alter table public.os_itens
  add column if not exists peca_id uuid references public.pecas_estoque(id) on delete set null,
  add column if not exists custo_unit numeric not null default 0;
create index if not exists os_itens_peca_idx on public.os_itens (peca_id) where peca_id is not null;

-- Baixa e devolução automáticas do estoque (SECURITY DEFINER: o mecânico lança a peça, mas não edita o estoque).
create or replace function public.os_itens_estoque() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.papel_atual() is null then
    raise exception 'Sem permissão' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    if new.peca_id is not null then
      update public.pecas_estoque set qtd = qtd - new.qtd where id = new.peca_id returning custo into new.custo_unit;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.peca_id is not null then
      update public.pecas_estoque set qtd = qtd + old.qtd where id = old.peca_id;
    end if;
    return old;
  end if;
  return new;
end $$;
drop trigger if exists os_itens_estoque_ins on public.os_itens;
create trigger os_itens_estoque_ins before insert on public.os_itens
  for each row execute function public.os_itens_estoque();
drop trigger if exists os_itens_estoque_del on public.os_itens;
create trigger os_itens_estoque_del after delete on public.os_itens
  for each row execute function public.os_itens_estoque();

-- ============ Checklist de entrada e saída ============
create table if not exists public.os_checklist (
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  momento text not null check (momento in ('entrada', 'saida')),
  item text not null check (char_length(item) <= 120),
  primary key (os_id, momento, item)
);

-- Guarda só os itens marcados, de forma atômica.
create or replace function public.salvar_checklist(p_os uuid, p_momento text, p_itens text[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if p_momento not in ('entrada', 'saida') then raise exception 'Momento inválido' using errcode = '22023'; end if;
  delete from public.os_checklist where os_id = p_os and momento = p_momento;
  insert into public.os_checklist (os_id, momento, item)
    select p_os, p_momento, i from (select distinct unnest(p_itens) as i) s where i <> '';
end $$;
revoke all on function public.salvar_checklist(uuid, text, text[]) from public, anon;
grant execute on function public.salvar_checklist(uuid, text, text[]) to authenticated;

-- ============ Orçamento digital ============
create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  itens jsonb not null,
  total numeric not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado', 'substituido')),
  aceite_nome text,
  respondido_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists orcamentos_os_idx on public.orcamentos (os_id, criado_em desc);

-- Congela os itens atuais da OS num orçamento novo (o anterior pendente fica "substituido").
create or replace function public.criar_orcamento(p_os uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_itens jsonb; v_total numeric; v_token uuid;
begin
  select coalesce(jsonb_agg(jsonb_build_object('descricao', descricao, 'tipo', tipo, 'qtd', qtd, 'valor_unit', valor_unit) order by id), '[]'::jsonb),
         coalesce(sum(qtd * valor_unit), 0)
    into v_itens, v_total from public.os_itens where os_id = p_os;
  if jsonb_array_length(v_itens) = 0 then
    raise exception 'Lance ao menos um serviço ou peça antes de gerar o orçamento' using errcode = '22023';
  end if;
  update public.orcamentos set status = 'substituido' where os_id = p_os and status = 'pendente';
  insert into public.orcamentos (os_id, itens, total) values (p_os, v_itens, v_total) returning token into v_token;
  update public.ordens_servico set status = 'aprovacao' where id = p_os and status in ('aguardando', 'diagnostico');
  return v_token;
end $$;
revoke all on function public.criar_orcamento(uuid) from public, anon;
grant execute on function public.criar_orcamento(uuid) to authenticated;

-- Leitura pública pelo token (não adivinhável). Só expõe o necessário e o primeiro nome do cliente.
create or replace function public.orcamento_publico(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'numero', o.numero, 'placa', v.placa, 'modelo', v.modelo, 'ano', v.ano,
    'cliente', split_part(c.nome, ' ', 1),
    'itens', q.itens, 'total', q.total, 'status', q.status,
    'aceite_nome', q.aceite_nome, 'respondido_em', q.respondido_em, 'criado_em', q.criado_em
  )
  from public.orcamentos q
  join public.ordens_servico o on o.id = q.os_id
  join public.veiculos v on v.id = o.veiculo_id
  join public.clientes c on c.id = o.cliente_id
  where q.token = p_token
$$;
revoke all on function public.orcamento_publico(uuid) from public;
grant execute on function public.orcamento_publico(uuid) to anon, authenticated;

-- Resposta do cliente: registra aceite (nome + data) e move a OS. Só responde uma vez.
create or replace function public.responder_orcamento(p_token uuid, p_aprovar boolean, p_nome text)
returns text language plpgsql security definer set search_path = '' as $$
declare q public.orcamentos;
begin
  select * into q from public.orcamentos where token = p_token for update;
  if not found then return 'inexistente'; end if;
  if q.status <> 'pendente' then return q.status; end if;
  if p_aprovar and char_length(trim(coalesce(p_nome, ''))) < 3 then
    raise exception 'Digite seu nome completo para aprovar' using errcode = '22023';
  end if;
  update public.orcamentos set status = case when p_aprovar then 'aprovado' else 'recusado' end,
    aceite_nome = left(trim(coalesce(p_nome, '')), 120), respondido_em = now()
    where id = q.id;
  if p_aprovar then
    update public.ordens_servico set status = 'em_servico'
      where id = q.os_id and status in ('aguardando', 'diagnostico', 'aprovacao');
  end if;
  return case when p_aprovar then 'aprovado' else 'recusado' end;
end $$;
revoke all on function public.responder_orcamento(uuid, boolean, text) from public;
grant execute on function public.responder_orcamento(uuid, boolean, text) to anon, authenticated;

-- ============ Agenda ============
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  inicio timestamptz not null,
  descricao text not null check (char_length(descricao) between 1 and 300),
  nome text check (char_length(nome) <= 120),
  telefone text check (char_length(telefone) <= 20),
  placa text check (char_length(placa) <= 8),
  mecanico_id uuid references auth.users(id) on delete set null,
  os_id uuid references public.ordens_servico(id) on delete set null,
  status text not null default 'marcado' check (status in ('marcado', 'concluido', 'cancelado')),
  criado_em timestamptz not null default now()
);
create index if not exists agenda_inicio_idx on public.agendamentos (inicio);
create index if not exists agenda_mecanico_idx on public.agendamentos (mecanico_id);

-- ============ RLS ============
alter table public.pecas_estoque enable row level security;
alter table public.os_checklist enable row level security;
alter table public.orcamentos enable row level security;
alter table public.agendamentos enable row level security;

do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and tablename in ('pecas_estoque', 'os_checklist', 'orcamentos', 'agendamentos')
  loop execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['os_checklist', 'orcamentos', 'agendamentos'] loop
    execute format('create policy "equipe le" on public.%I for select to authenticated using (public.papel_atual() is not null)', t);
    execute format('create policy "equipe insere" on public.%I for insert to authenticated with check (public.papel_atual() is not null)', t);
    execute format('create policy "equipe altera" on public.%I for update to authenticated using (public.papel_atual() is not null) with check (public.papel_atual() is not null)', t);
    execute format('create policy "equipe apaga" on public.%I for delete to authenticated using (public.papel_atual() is not null)', t);
  end loop;
end $$;

-- Estoque: toda a equipe vê; só dono e atendente alteram.
create policy "equipe le" on public.pecas_estoque for select to authenticated using (public.papel_atual() is not null);
create policy "gestao insere" on public.pecas_estoque for insert to authenticated with check (public.papel_atual() in ('dono', 'atendente'));
create policy "gestao altera" on public.pecas_estoque for update to authenticated
  using (public.papel_atual() in ('dono', 'atendente')) with check (public.papel_atual() in ('dono', 'atendente'));
create policy "gestao apaga" on public.pecas_estoque for delete to authenticated using (public.papel_atual() in ('dono', 'atendente'));

revoke all on public.pecas_estoque, public.os_checklist, public.orcamentos, public.agendamentos from anon;
grant select, insert, update, delete on public.pecas_estoque, public.os_checklist, public.orcamentos, public.agendamentos to authenticated;

-- Ajuste atômico de estoque (entrada/correção). Negativo além do saldo viola o CHECK (23514).
create or replace function public.ajustar_estoque(p_id uuid, p_delta numeric) returns void
language plpgsql security invoker set search_path = '' as $$
declare n int;
begin
  update public.pecas_estoque set qtd = qtd + p_delta where id = p_id;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Sem permissão ou peça inexistente' using errcode = '42501'; end if;
end $$;
revoke all on function public.ajustar_estoque(uuid, numeric) from public, anon;
grant execute on function public.ajustar_estoque(uuid, numeric) to authenticated;
