## Why

Embora as contas bancárias e o saldo consolidado já estejam sincronizados e visíveis no Dashboard, a seção "Extrato de Transações" e os indicadores do mês continuam estáticos ou vazios, impedindo o usuário de acompanhar suas despesas e receitas recentes. A sincronização e exibição das transações recentes é essencial para completar a Fase 1 (MVP) e fornecer a base de dados necessária para o Plano 2 (Orçamentos, Limites e Previsões).

## What Changes

- **Backend Fastify (`apps/api`)**:
  - Implementação de endpoint autenticado `GET /api/transactions` para consulta paginada e filtrada de transações do usuário.
  - Aprimoramento da rotina de sincronização de transações no `syncItemData` e suporte a sincronização de transações recentes por conta/item.
  - Cálculo de métricas financeiras mensais: Total de Receitas do Mês, Total de Despesas do Mês e Saldo Líquido Mensal.
- **Tipos e Contratos (`packages/types`)**:
  - Schemas Zod e tipos TypeScript para `TransactionWithAccountDTO`, `TransactionsListResponse` e parâmetros de consulta (`accountId`, `startDate`, `endDate`, `limit`, `page`).
  - Schemas para indicadores mensais (`MonthlyFinancialSummary`).
- **Frontend Web (`apps/web`)**:
  - Atualização do Dashboard Next.js para renderizar os cards de métricas do mês (Receitas, Despesas, Balanço Líquido).
  - Substituição do empty state por uma tabela/feed responsivo de transações recentes com data formatada, ícone de categoria, conta vinculada e valor colorido (verde para receita/crédito, vermelho para despesa/débito).
  - Empty state contextualizado caso o usuário possua contas mas ainda não tenha movimentações no período.

## Capabilities

### Modified Capabilities
- `financial-dashboard`: Adiciona requisitos para sincronização de transações bancárias, cálculo de indicadores mensais (receitas, despesas, balanço líquido) e renderização do feed de extrato financeiro no Dashboard.

## Impact

- **Banco de Dados**: Leituras e escritas na tabela `pluggy_transactions` do Drizzle ORM.
- **API**: Nova rota autenticada `GET /api/transactions` em `apps/api/src/routes/finances.ts` ou `transactions.ts`.
- **Frontend**: Componentes do Dashboard em `apps/web/src/app/dashboard/page.tsx` e helpers em `apps/web/src/lib/server/transactions.ts`.
- **Testes**: Novos testes unitários no Vitest para schemas Zod e cálculos mensais; testes de integração na rota Fastify; e testes E2E Playwright validando a exibição do extrato e indicadores do mês.
