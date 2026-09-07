## 1. Camada de Dados e Contratos Compartilhados (`packages/database` & `packages/types`)

- [x] 1.1 Criar schema Drizzle para a tabela `budgets` em `packages/database/src/schema/budgets.ts` e exportar no índice do pacote
- [x] 1.2 Definir schemas Zod e tipos TypeScript para orçamentos (`CreateBudgetSchema`, `UpdateBudgetSchema`, `BudgetWithConsumptionSchema`, `BudgetsListResponseSchema`) em `packages/types/src/budgets.ts` e exportar em `index.ts`
- [x] 1.3 Adicionar testes unitários no Vitest em `packages/types/src/__tests__/schemas.test.ts` para validação dos schemas de orçamento

## 2. Backend Fastify (`apps/api`)

- [x] 2.1 Criar rotas CRUD de orçamentos em `apps/api/src/routes/budgets.ts` com cálculo de consumo em tempo real e Safe to Spend diário
- [x] 2.2 Registrar `budgetsRoutes` no aplicativo Fastify em `apps/api/src/app.ts`
- [x] 2.3 Criar testes de integração no Vitest (`apps/api/src/__tests__/budgets.test.ts`) cobrindo criação, listagem com cálculo de Safe to Spend, atualização, remoção e proteção por JWT

## 3. Frontend Web (`apps/web`)

- [x] 3.1 Criar helper Server Component `apps/web/src/lib/server/budgets.ts` para consulta de orçamentos do mês corrente
- [x] 3.2 Criar componente de orçamentos (`apps/web/src/components/BudgetsSection.tsx`) com barras de termômetro visual (verde/amarelo/vermelho), Safe to Spend e modal de novo orçamento
- [x] 3.3 Integrar o componente `BudgetsSection` no Dashboard (`apps/web/src/app/dashboard/page.tsx`)

## 4. Validação e Qualidade

- [x] 4.1 Criar teste E2E no Playwright (`apps/web/e2e/dashboard-budgets.spec.ts`) validando a exibição do termômetro de consumo e criação de orçamento
- [x] 4.2 Executar suíte completa de testes automatizados (`pnpm test` e `pnpm --filter @healthinance/web test:e2e`) com 100% de sucesso
- [x] 4.3 Validar change com `openspec validate feat-budgets-and-limits` e executar build do monorepo (`pnpm build`)
