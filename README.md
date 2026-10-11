# AM Auto Center

Site público e painel de gestão (ordens de serviço, pedidos do site e retornos) da AM Auto Center.
Next.js 16 · React 19 · Tailwind 4 · Supabase. Veja o roadmap em [PLANO.md](PLANO.md).

## Colocando no ar (passo a passo)

Nenhuma alteração de código é necessária. O que falta é **configurar o Supabase e a Vercel**:

1. **Crie o seu usuário** no Supabase: *Authentication > Users > Add user* (e-mail e senha). Ele será o **dono**.
2. **Instale o banco**: *SQL Editor > New query*, cole todo o conteúdo de [`supabase/setup-completo.sql`](supabase/setup-completo.sql) e clique em **Run**.
   Pode rodar de novo quando houver novas versões; nada é apagado. (Se o seu usuário foi criado *depois* de rodar, veja o passo 4.)
3. **Variáveis na Vercel** (*Project > Settings > Environment Variables*, depois faça um novo deploy):
   | Variável | Obrigatória | Onde achar |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | sim | Supabase > Project Settings > API > Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim | Supabase > API Keys > *publishable* (ou `anon`) |
   | `NEXT_PUBLIC_SITE_URL` | sim | o domínio do site, ex.: `https://seudominio.com.br` |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | só para notificações | `npx web-push generate-vapid-keys` |
   | `SUPABASE_SERVICE_ROLE_KEY` | só para notificações e resumo das 8h | Supabase > API Keys > *secret* (**nunca** compartilhe) |
   | `CRON_SECRET` | só para o resumo das 8h | qualquer texto longo e aleatório |
4. **Se o seu usuário não virou dono** (foi criado depois do passo 2), rode no SQL Editor, trocando o e-mail:
   ```sql
   update public.perfis set papel = 'dono', ativo = true
   where user_id = (select id from auth.users where email = 'seu@email.com');
   ```
5. **Desligue o cadastro público** (segurança extra): Supabase > Authentication > Sign In / Providers > Email > desative *Allow new users to sign up*.
   Mesmo ligado, contas novas entram **bloqueadas** até o dono liberar em *Mais > Equipe*.
6. **Confira tudo** abrindo `/painel/diagnostico` (ou *Mais > Diagnóstico do sistema*): ele lista o que ainda falta no banco e nas variáveis.

**Deu a mensagem "Não foi possível abrir esta tela" (ou o erro React #441)?** Em produção o Next esconde a mensagem real do servidor.
Na grande maioria das vezes é o passo 2 (banco sem as atualizações) ou o passo 3. Abra o diagnóstico; se ele estiver tudo certo, procure o
*código do erro* mostrado na tela nos logs da Vercel (*Deployments > Logs*).

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
novas contas entram **bloqueadas** (como `mecanico`, inativas) até o dono liberar em *Mais > Equipe*. Para promover alguém por SQL:

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

## Site público e SEO (Fase 5)

- **Páginas por serviço** (`/servicos` e `/servicos/<slug>`): freios, suspensão e direção, pneus, troca de óleo, bateria,
  diagnóstico de motor e guincho. Cada uma tem título e descrição próprios, canonical, imagem de compartilhamento (OG),
  perguntas frequentes e dados estruturados (`Service`, `FAQPage`, `BreadcrumbList`). O texto fica em `src/lib/servicos.ts`.
- **Dados estruturados do negócio** (`AutoRepair` + `WebSite`) em `src/lib/schema.ts`, só com dados confirmados.
  Não há avaliações, horário por dia nem coordenadas: adicione quando a oficina confirmar (`openingHoursSpecification`, `geo`).
- **Sitemap** com `lastModified` vindo de `site.conteudoAtualizadoEm` (atualize quando mudar os textos); `robots.txt` bloqueia
  painel, login e páginas com link-segredo.
- **Desempenho**: fontes reduzidas (5 arquivos em vez de 7) e catálogo de peças que só é hidratado quando o visitante chega perto,
  abre `/#pecas` ou toca no botão (o texto continua no HTML para os buscadores).
- **Conversões sem cookies** (`/painel/site`, dono e atendente): visitas, cliques no WhatsApp, mapa e Instagram, de onde vieram
  (UTM ou site de origem) e o que gera contato. Não guarda IP nem identificador de pessoa e respeita "Não rastrear"/GPC.
  Use links com `?utm_source=instagram&utm_medium=bio` na bio e nas campanhas para ver a origem. Eventos com mais de 13 meses
  são apagados pelo cron diário.

### Depois de publicar
1. Defina `NEXT_PUBLIC_SITE_URL` com o domínio real (canonical, sitemap e dados estruturados dependem dele).
2. Cadastre o site no Google Search Console e envie `/sitemap.xml`.
3. Reivindique/atualize o perfil da empresa no Google (nome, endereço e telefone iguais aos do site) e coloque o link do site.
4. Revise os textos de `src/lib/servicos.ts` e `src/lib/faq-home.ts` com a oficina: são informativos e genéricos, sem preço,
   prazo, marca ou garantia.
