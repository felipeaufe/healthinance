## 1. Contratos e Tipos Compartilhados (`packages/types`)

- [x] 1.1 Definir schemas Zod e tipos TypeScript para contas bancárias com conector em `packages/types/src/accounts.ts`
- [x] 1.2 Exportar os novos schemas no índice de types e adicionar testes unitários no Vitest

## 2. Backend Fastify (`apps/api`)

- [x] 2.1 Implementar rota autenticada `GET /api/accounts` em `apps/api/src/routes/accounts.ts` unindo contas e conectores com Drizzle ORM
- [x] 2.2 Registrar a rota `accountsRoutes` no aplicativo Fastify em `apps/api/src/app.ts`
- [x] 2.3 Criar testes de integração no Vitest (`apps/api/src/__tests__/accounts.test.ts`) cobrindo retorno 200 com contas e 401 sem autenticação

## 3. Frontend Web (`apps/web`)

- [x] 3.1 Adicionar suporte a `@healthinance/database` em `apps/web` para consulta direta via Server Component
- [x] 3.2 Atualizar `apps/web/src/app/dashboard/page.tsx` para carregar contas bancárias e calcular Saldo Total e número de bancos
- [x] 3.3 Renderizar a seção de cards de contas bancárias conectadas com formatação monetária (BRL) e tags de tipo de conta
- [x] 3.4 Manter estado de fallback quando o usuário não tiver contas e suporte a refresh após nova conexão via widget

## 4. Validação e Qualidade

- [x] 4.1 Adicionar teste Playwright E2E validando a renderização dinâmica dos dados e cards de contas no Dashboard
- [x] 4.2 Executar testes automatizados unificados (`pnpm test` e `pnpm --filter @healthinance/web test:e2e`) com 100% de sucesso
- [x] 4.3 Executar build de produção do monorepo (`pnpm build`) e validar change com `openspec validate`
