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
