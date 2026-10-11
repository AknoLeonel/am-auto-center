# AM Auto Center

Site público e painel de gestão (ordens de serviço, pedidos do site e retornos) da AM Auto Center.
Next.js 16 · React 19 · Tailwind 4 · Supabase. Veja o roadmap em [PLANO.md](PLANO.md).

## Rodando localmente

```bash
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm install
npm run dev
```

Scripts: `npm run lint`, `npm run typecheck`, `npm run build`.

## Banco de dados

As migrations ficam em `supabase/migrations` e são idempotentes. Aplique com a CLI do Supabase
(`supabase db push`) ou cole o SQL no SQL Editor, em ordem.

**Papéis** (tabela `perfis`): `dono`, `atendente` e `mecanico`. Contas já existentes viram `dono`;
novas contas entram como `mecanico`. Para promover alguém:

```sql
update public.perfis set papel = 'atendente' where user_id = '<uuid>';
```

Toda tabela tem RLS ligado; o público só consegue **inserir** em `pedidos_site`.

## Autenticação

A sessão fica em cookies (`@supabase/ssr`). O `src/proxy.ts` redireciona `/painel/*` para `/login`
quando não há sessão. É uma checagem otimista: a proteção real dos dados é o RLS.

## Fotos das ordens de serviço

As fotos vão para o bucket privado `os-fotos` (Supabase Storage), criado pela migration da Fase 1.
São reduzidas no aparelho antes do envio e exibidas por URL assinada (1 hora).

## Orçamento digital

Na OS, "Gerar link de orçamento" congela os itens atuais e cria um link público (`/o/<token>`).
O cliente vê os itens no celular e aprova (com o nome) ou recusa; o aceite fica registrado e a OS
avança sozinha para "Em serviço". Gerar um novo orçamento invalida o link anterior.
O link é a credencial: use uma `NEXT_PUBLIC_SITE_URL` correta em produção.

## Estoque

Toda a equipe vê o estoque; só `dono` e `atendente` cadastram e ajustam peças. Ao lançar uma peça
do estoque na OS, a baixa é automática (e devolvida se o item for removido). O custo é guardado no
item, para o cálculo de margem da Fase 3.

## Dados e financeiro (Fase 3)

- **Auditoria** (`/painel/auditoria`, só dono): toda criação, alteração e exclusão nas tabelas de negócio é registrada por
  trigger, com o usuário e os campos que mudaram. Ninguém consegue editar ou apagar esses registros pelo app.
- **Linha do tempo da OS**: cada mudança de situação grava quem mudou e quando; o tempo em cada etapa alimenta o dashboard.
  As OS anteriores à migration ganham uma reconstrução aproximada.
- **Pagamentos** (dono e atendente): vários por OS (Pix, dinheiro, débito, crédito, transferência). O saldo é
  `total da OS - pagamentos`. Só o dono estorna. OS com pagamento não pode ser apagada.
- **Financeiro** (`/painel/financeiro`, só dono): receita (pela data de entrega), margem, ticket médio, tempo médio,
  aprovação de orçamentos, clientes que voltaram e rankings. A margem usa só o custo das peças do estoque;
  peça avulsa e mão de obra entram com custo zero.
- **Relatórios**: CSV (separador `;`, UTF-8 com BOM, vírgula decimal) de OS, pagamentos e estoque.
- Datas e períodos usam o horário da Bahia (UTC-3).

## App offline, tempo real e notificações (Fase 4)

- **Offline**: o service worker guarda os arquivos do app e as últimas páginas do painel vistas; sem sinal, abre a última
  versão (ou a página "Sem conexão"). As páginas guardadas são apagadas ao sair da conta. Páginas com link-segredo
  (`/o`, `/acompanhar`) e a API nunca são guardadas.
- **Fila de envio**: mudar a situação, anotar observações, lançar item e tirar foto funcionam sem internet. A alteração é gravada
  no aparelho (IndexedDB) e sobe sozinha quando o sinal volta, em ordem. Cada operação tem um id e o banco ignora reenvios
  (`aplicar_op`), então nada duplica. Erros de regra (ex.: estoque insuficiente) aparecem na barra do topo para descartar.
  A data de uma mudança de situação feita offline é a do envio, não a do toque.
- **Tempo real**: o painel se atualiza sozinho quando outra pessoa mexe (Supabase Realtime, respeitando o RLS). Se a conexão
  cair, volta a atualizar a cada 30 s.
- **Acompanhamento do cliente**: na OS, "Enviar link de acompanhamento" manda `/acompanhar/<token>` (sem valores, só o
  primeiro nome). O link expira 90 dias após a entrega.
- **Notificações push** (opcional): pedido novo do site, orçamento aprovado/recusado e resumo das 8h (Vercel Cron).
  Configure as variáveis do `.env.example` (`npx web-push generate-vapid-keys`) e ative em Mais > Notificações, em cada aparelho.
  No iPhone é preciso instalar o app na Tela de Início (iOS 16.4+). `SUPABASE_SERVICE_ROLE_KEY` é só do servidor.
