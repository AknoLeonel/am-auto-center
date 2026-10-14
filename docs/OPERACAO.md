# Operação do sistema: AM Auto Center

Para o dono e para quem der suporte técnico. Complementa o [README](../README.md) (instalação) e o [manual da equipe](MANUAL.md).

## Antes de colocar no ar (checklist)

- [ ] Banco instalado: `npm run db:aplicar -- "<connection string>"` (ou o SQL Editor). Confira em `/painel/diagnostico`: **nada em vermelho**.
- [ ] Variáveis na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL` (domínio real).
- [ ] Seu usuário existe, está **ativo** e é **dono** (Mais > Equipe).
- [ ] Cadastro público desligado: Supabase > Authentication > Sign In / Providers > Email > *Allow new users to sign up* **desligado**.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` na Vercel (permite registrar erros reais, enviar push e o resumo das 8h). Chave **secreta**: só na Vercel.
- [ ] Google Search Console: site cadastrado e `/sitemap.xml` enviado. Perfil da empresa no Google com o mesmo nome, endereço e telefone do site.
- [ ] Textos de `src/lib/servicos.ts` e `src/lib/faq-home.ts` revisados com a oficina (informativos, sem preço, prazo, marca ou garantia).
- [ ] Um **backup** feito e guardado (veja abaixo) e uma OS de teste criada, aprovada pelo link e entregue de ponta a ponta no celular.

## Quando algo dá errado

1. **Abra `/painel/diagnostico`** (Mais > Diagnóstico). Ele mostra o que falta no banco e nas variáveis.
2. Na mesma tela, **Últimos erros do servidor** mostra a mensagem *real* dos erros (o navegador só mostra "React error #441" ou um código por segurança). Procure o *Código do erro* que apareceu na tela.
3. Sem a chave de serviço, o erro completo fica nos logs da Vercel (*Deployments > Logs*). Procure o código.
4. Banco desatualizado: rode `npm run db:aplicar` de novo. É seguro repetir.

| Sintoma | Causa provável |
|---|---|
| Tela de ordens com erro, diagnóstico com funções faltando | Migrations não aplicadas |
| Login funciona mas tudo vazio / "perfil de acesso" faltando | Usuário sem perfil ativo (Mais > Equipe, ou o SQL do README, passo 4) |
| Links de orçamento/acompanhamento com `localhost` | `NEXT_PUBLIC_SITE_URL` não definida na Vercel |
| Notificações não chegam | Faltam `VAPID_*` / `SUPABASE_SERVICE_ROLE_KEY`; o aparelho não ativou em Mais > Notificações; no iPhone, o app precisa estar instalado (iOS 16.4+) |
| Resumo das 8h não chega | Falta `CRON_SECRET` ou a chave de serviço; confira *Settings > Cron Jobs* na Vercel |
| Fotos não sobem | Bucket `os-fotos` ausente (migration 1 não aplicada) |

## Backup e restauração

O Supabase **gratuito não faz backup que você possa baixar**. Duas camadas:

1. **Recomendado**: plano Pro do Supabase (backups diários automáticos e recuperação).
2. **Sempre**: backup próprio dos dados do app, toda semana (e antes de qualquer mudança grande):
   ```bash
   npm run db:backup -- "<connection string do Supabase>"
   ```
   Cria `backups/AAAA-MM-DD_HHMM/` com um arquivo por tabela. A pasta tem **dados de clientes**: guarde em local seguro (nunca no GitHub; `backups/` já está no `.gitignore`).
3. **Restaurar** (no **mesmo** projeto Supabase; só insere o que falta, não apaga nem sobrescreve):
   ```bash
   npm run db:restaurar -- backups/2026-10-14_0900 "<connection string>" --confirmo
   ```
   O número da próxima OS continua depois do maior restaurado, o estoque não é descontado de novo e a auditoria não ganha registros falsos.

**O que o backup não inclui**: contas de login (usuários e senhas), as **fotos** (Storage) e inscrições de notificação. Para as fotos, use o plano Pro ou baixe o bucket `os-fotos` periodicamente pelo painel do Supabase. Para reconstruir do zero em outro projeto, recrie os usuários primeiro (os perfis dependem deles).

## Segurança

- **Senha do banco**: nunca em chat, e-mail ou print. Se vazar, troque em *Project Settings > Database > Reset database password* (o site não é afetado, ele usa as chaves da API).
- **Chave `service_role`** e `CRON_SECRET`: só na Vercel.
- **Equipe**: contas novas entram bloqueadas; o dono libera. Revise *Mais > Equipe* de tempos em tempos e bloqueie quem saiu da oficina.
- **Auditoria** (*Mais > Auditoria*): quem mudou o quê. Ninguém consegue editar ou apagar esses registros pelo app.
- **Dados pessoais**: a medição do site não usa cookies, não guarda IP e respeita "Não rastrear". Páginas com link-segredo (orçamento e acompanhamento) não aparecem no Google.
- Computador ou celular compartilhado: use **Sair** ao terminar (isso também apaga as páginas guardadas para uso sem internet).

## Qualidade automática (a cada Pull Request)

O GitHub roda sozinho, e o PR só deve ser mergeado se tudo estiver verde:

| Verificação | O que garante |
|---|---|
| Lint, tipos, **testes unitários**, build | Regras de negócio (números, datas da Bahia, validações), rotas de API, diagnóstico, push |
| **Banco (Postgres 16)** | As migrations rodam duas vezes; RLS por papel; estoque, orçamento, pagamentos, auditoria; **backup e restauração de ponta a ponta** |
| **Navegador (Playwright)** | Site público (SEO, conversões, acessibilidade de toque), service worker sem internet de verdade, fila offline |
| **Lighthouse** | Desempenho ≥ 85, acessibilidade ≥ 95, SEO ≥ 95, boas práticas ≥ 90 em 3 páginas |

Rodar localmente: `npm test` (unitários), `npm run test:sql` (precisa de um Postgres: `TEST_DATABASE_URL=postgresql://postgres:senha@localhost:5432/postgres`), `npm run test:e2e` (navegador).

## Limitações conhecidas

- Foi testado com Postgres real e navegador real, mas **com o Supabase de verdade ainda não**: Realtime com a sessão por cookie, Storage e a entrega de notificações em aparelhos devem ser conferidos na primeira semana.
- Modo escuro e leitura de placa por câmera (OCR) ficaram de fora de propósito.
- A margem do Financeiro considera só o custo das peças do estoque (peça avulsa e mão de obra entram com custo zero).
- A data de uma mudança de situação feita **sem internet** é a do envio, não a do toque.
- O painel ainda não foi avaliado visualmente com a equipe; vale uma rodada de teste de 15 minutos com mecânico e atendente.
