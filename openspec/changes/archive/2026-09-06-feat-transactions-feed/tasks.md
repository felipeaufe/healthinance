## 1. Contratos e Tipos Compartilhados (`packages/types`)

- [x] 1.1 Definir schemas Zod e tipos TypeScript para transações com conector/conta (`TransactionWithAccountSchema`) e listagem paginada (`TransactionsListResponseSchema`) em `packages/types/src/transactions.ts`
- [x] 1.2 Definir schema para indicadores mensais (`MonthlyFinancialSummarySchema`) e exportar no índice do pacote
- [x] 1.3 Adicionar testes unitários no Vitest em `packages/types/src/__tests__/schemas.test.ts`

## 2. Backend Fastify (`apps/api`)

- [x] 2.1 Implementar endpoint autenticado `GET /api/transactions` em `apps/api/src/routes/finances.ts` com paginação, filtros e joins do Drizzle ORM
- [x] 2.2 Aprimorar o serviço de sincronização da Pluggy (`apps/api/src/services/pluggy.ts`) para persistência correta de transações
- [x] 2.3 Criar testes de integração no Vitest (`apps/api/src/__tests__/transactions.test.ts`) cobrindo cenários com autenticação e filtros

## 3. Frontend Web (`apps/web`)

- [x] 3.1 Criar helper Server Component `apps/web/src/lib/server/transactions.ts` para consulta de transações recentes e cálculo dos indicadores mensais
- [x] 3.2 Atualizar `apps/web/src/app/dashboard/page.tsx` para renderizar os cards de indicadores do mês (Receitas, Despesas, Balanço Líquido)
- [x] 3.3 Substituir o placeholder do extrato por um feed de transações com categoria, conta vinculada, data formatada e badge de valor colorido
- [x] 3.4 Tratar empty state quando não houver transações

## 4. Validação e Qualidade

- [x] 4.1 Criar teste E2E no Playwright (`apps/web/e2e/dashboard-transactions.spec.ts`) validando os indicadores do mês e o extrato de transações
- [x] 4.2 Executar testes automatizados unificados (`pnpm test` e `pnpm --filter @healthinance/web test:e2e`)
- [x] 4.3 Validar change com `openspec validate feat-transactions-feed` e executar build do monorepo (`pnpm build`)
