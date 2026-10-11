-- Segurança: usuários novos entram INATIVOS até o dono liberar.
-- Antes, qualquer conta criada no Supabase Auth (inclusive por cadastro público, se ligado)
-- nascia como "mecânico" ativo e enxergava os dados da oficina. Agora papel_atual() devolve nulo
-- para eles e o RLS bloqueia tudo até o dono ativar em Mais > Equipe.
alter table public.perfis alter column ativo set default false;

-- Quem já era ativo continua ativo. Só os cadastros futuros mudam.
