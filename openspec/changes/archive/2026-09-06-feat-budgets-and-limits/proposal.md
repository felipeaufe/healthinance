## Why

Com as contas bancárias e o feed de transações consolidados no Healthinance, o sistema precisa avançar do registro retroativo para o controle orçamentário ativo e preventivo (Fase 2). A funcionalidade de Orçamentos e Tetos de Gastos permite que o usuário estabeleça limites mensais por categoria, acompanhe o termômetro de consumo em tempo real e saiba exatamente quanto pode gastar por dia de forma segura ("Safe to Spend") sem estourar suas metas.

## What Changes

- **Camada de Dados (`packages/database`)**:
  - Nova tabela `budgets` com Drizzle ORM associada a `users`, contendo `id`, `user_id`, `category`, `amount`, `period_month`, `period_year`, `alert_percent` e timestamps.
- **Tipos e Contratos (`packages/types`)**:
  - Schemas Zod e tipos TypeScript: `CreateBudgetSchema`, `UpdateBudgetSchema`, `BudgetWithConsumptionSchema`, `BudgetsListResponseSchema`.
- **Backend Fastify (`apps/api`)**:
  - Rotas CRUD autenticadas via Supabase JWT: `GET /api/budgets`, `POST /api/budgets`, `PUT /api/budgets/:id`, `DELETE /api/budgets/:id`.
  - Agregação do consumo em tempo real cruzando transações de débito da categoria com o teto estabelecido.
  - Cálculo do "Safe to Spend" diário até o encerramento do mês.
- **Frontend Web (`apps/web`)**:
  - Componente de Orçamentos e Metas de Gastos no Dashboard Next.js com termômetro visual dinâmico (Verde $le 70%$, Amarelo 1-90%$, Vermelho $> 90%$ ou estouro).
  - Modal/Formulário para definir novos limites ou ajustar tetos por categoria.
  - Indicador de ritmo de gasto diário seguro ("Safe to Spend").

## Capabilities

### New Capabilities
- `budgets-and-limits`: Gestão de tetos orçamentários mensais por categoria, termômetro visual de consumo e cálculo de ritmo diário seguro de gastos ("Safe to Spend").

## Impact

- **Banco de Dados**: Criação da tabela `budgets` em `packages/database/src/schema/budgets.ts`.
- **API**: Nova rota `budgetsRoutes` em `apps/api/src/routes/budgets.ts` registrada no Fastify.
- **Frontend**: Componentes de orçamento em `apps/web/src/components/BudgetsSection.tsx` e helpers em `apps/web/src/lib/server/budgets.ts`.
- **Testes**: Testes unitários com Vitest em `@healthinance/types`, testes de integração na API Fastify e testes E2E no Playwright.
