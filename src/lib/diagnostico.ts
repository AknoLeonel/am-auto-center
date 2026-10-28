import type { SupabaseClient } from "@supabase/supabase-js";

export type Item = { grupo: string; nome: string; ok: boolean; detalhe?: string; migration?: string; opcional?: boolean };

const M0 = "20261011000000_base_rls_papeis.sql";
const M1 = "20261011010000_fase1_os_transacional_fotos.sql";
const M2 = "20261011020000_fase2_operacao.sql";
const M3 = "20261011030000_fase3_dados.sql";
const M4 = "20261011040000_fase4_pwa_tempo_real.sql";
const M5 = "20261011050000_fase5_eventos_site.sql";
const M7 = "20261011070000_fase6_erros_app.sql";
const M8 = "20261028000000_correcoes_revisao.sql";

const TABELAS: [string, string][] = [
  ["clientes", M0], ["veiculos", M0], ["ordens_servico", M0], ["os_itens", M0], ["lembretes", M0], ["pedidos_site", M0], ["perfis", M0],
  ["os_fotos", M1], ["pecas_estoque", M2], ["os_checklist", M2], ["orcamentos", M2], ["agendamentos", M2],
  ["auditoria", M3], ["pagamentos", M3], ["os_status_hist", M3], ["os_etapas", M3], ["os_financeiro", M3],
  ["fila_ops", M4], ["push_subs", M4], ["eventos_site", M5], ["erros_app", M7],
];
const COLUNAS: [string, string, string][] = [
  ["ordens_servico", "mecanico_id,garantia_dias,entregue_em", M2], ["os_itens", "peca_id,custo_unit", M2], ["ordens_servico", "token_publico", M4],
  ["ordens_servico", "cancelada_em", M8], ["os_itens", "estoque_baixado", M8], ["pedidos_site", "visitante", M8],
];
// Funções chamadas com argumentos que não gravam nada (falham antes ou devolvem vazio).
const ZERO = "00000000-0000-0000-0000-000000000000";
const FUNCOES: [string, Record<string, unknown>, string][] = [
  ["papel_atual", {}, M0], ["listar_os", { p_limite: 1 }, M1], ["equipe_ativa", {}, M2],
  ["orcamento_publico", { p_token: ZERO }, M2], ["criar_orcamento", { p_os: ZERO }, M2], ["salvar_checklist", { p_os: ZERO, p_momento: "x", p_itens: [] }, M2],
  ["ajustar_estoque", { p_id: ZERO, p_delta: 0 }, M2], ["dashboard", { p_ini: "2000-01-01", p_fim: "2000-01-02" }, M3],
  ["aplicar_op", { p_id: ZERO, p_tipo: "x", p_dados: {} }, M4], ["acompanhar_publico", { p_token: ZERO }, M4],
  ["resumo_site", { p_ini: "2000-01-01", p_fim: "2000-01-02" }, M5],
];

type Erro = { code?: string; message?: string } | null;
const AUSENTE = new Set(["PGRST202", "PGRST205", "PGRST204", "42P01", "42883", "42703"]);

// "Ausente" = o objeto não existe. Qualquer outro erro (permissão, regra de negócio) prova que ele existe.
export function classificar(e: Erro): "ok" | "ausente" | "sem-conexao" {
  if (!e) return "ok";
  if (!e.code && !e.message) return "ausente"; // erro vazio (ex.: resposta sem corpo): não dá para afirmar que existe
  if (e.code && AUSENTE.has(e.code)) return "ausente";
  if (/could not find|does not exist|schema cache/i.test(e.message ?? "")) return "ausente";
  if (!e.code && /fetch|network|econn|enotfound|timeout/i.test(e.message ?? "")) return "sem-conexao";
  return "ok";
}

const ajuda = (c: ReturnType<typeof classificar>) => (c === "sem-conexao" ? "Não consegui falar com o Supabase. Confira a URL e a chave." : "Não encontrado no banco.");

export async function diagnosticar(supabase: SupabaseClient, env: Record<string, string | undefined>): Promise<Item[]> {
  const itens: Item[] = [];

  const tabelas = await Promise.all(TABELAS.map(async ([t, m]) => {
    // GET (não HEAD): num HEAD o PostgREST responde 404 sem corpo e o supabase-js o trata como sucesso.
    const { error } = await supabase.from(t).select("*").limit(0);
    return { t, m, c: classificar(error) };
  }));
  for (const { t, m, c } of tabelas) {
    // O bucket de fotos é criado na mesma atualização da tabela os_fotos (não dá para checar o bucket sem a chave de serviço).
    const extra = t === "os_fotos" && c === "ok" ? "Inclui o armazenamento de fotos (criado pela mesma atualização)." : undefined;
    itens.push({ grupo: "Tabelas e visões", nome: t, ok: c === "ok", detalhe: c === "ok" ? extra : ajuda(c), migration: m });
  }

  const colunas = await Promise.all(COLUNAS.map(async ([t, cols, m]) => {
    const { error } = await supabase.from(t).select(cols).limit(0);
    return { t, cols, m, c: classificar(error) };
  }));
  for (const { t, cols, m, c } of colunas) itens.push({ grupo: "Colunas novas", nome: `${t}.${cols.replaceAll(",", ", ")}`, ok: c === "ok", detalhe: c === "ok" ? undefined : ajuda(c), migration: m });

  const funcoes = await Promise.all(FUNCOES.map(async ([f, args, m]) => {
    const { error } = await supabase.rpc(f, args);
    return { f, m, c: classificar(error) };
  }));
  for (const { f, m, c } of funcoes) itens.push({ grupo: "Funções do banco", nome: f, ok: c === "ok", detalhe: c === "ok" ? undefined : ajuda(c), migration: m });

  const { data: papel, error: ep } = await supabase.rpc("papel_atual");
  itens.push({
    grupo: "Sua conta", nome: "perfil de acesso", ok: !!papel,
    detalhe: papel ? `Papel: ${papel}` : ep ? "Não deu para ler o perfil (veja as funções acima)." : "Seu usuário não tem perfil ativo. Veja o passo 4 do README (ativar o dono).",
  });

  const tem = (k: string) => !!env[k];
  const site = env.NEXT_PUBLIC_SITE_URL ?? "";
  itens.push(
    { grupo: "Variáveis de ambiente (Vercel)", nome: "NEXT_PUBLIC_SUPABASE_URL", ok: tem("NEXT_PUBLIC_SUPABASE_URL") },
    { grupo: "Variáveis de ambiente (Vercel)", nome: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ok: tem("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") },
    { grupo: "Variáveis de ambiente (Vercel)", nome: "NEXT_PUBLIC_SITE_URL (domínio real, sem localhost)", ok: !!site && !/localhost/.test(site), detalhe: site ? undefined : "Sem isso, o sitemap e os links do orçamento saem com localhost." },
    { grupo: "Opcionais (push, resumo diário)", nome: "NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY", ok: tem("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && tem("VAPID_PRIVATE_KEY"), opcional: true, detalhe: "Notificações no celular." },
    { grupo: "Opcionais (push, resumo diário)", nome: "SUPABASE_SERVICE_ROLE_KEY", ok: tem("SUPABASE_SERVICE_ROLE_KEY"), opcional: true, detalhe: "Necessária para enviar push e o resumo das 8h." },
    { grupo: "Opcionais (push, resumo diário)", nome: "CRON_SECRET", ok: tem("CRON_SECRET"), opcional: true, detalhe: "Protege o resumo diário." },
  );
  return itens;
}

export const migrationsFaltando = (itens: Item[]) => [...new Set(itens.filter((i) => !i.ok && i.migration).map((i) => i.migration!))].sort();
