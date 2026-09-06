## Why

Após a sincronização bem-sucedida de contas bancárias e transações via Pluggy Connect Widget, a interface do usuário no Dashboard (`apps/web/src/app/dashboard/page.tsx`) permanece exibindo valores mockados estáticos (`R$ 0,00`, `0 bancos` e `Nenhuma transação registrada ainda`), sem consultar as contas e instituições persistidas no PostgreSQL pelo Drizzle ORM. Este change introduz a visualização dinâmica e em tempo real dos dados bancários do usuário autenticado no Dashboard, permitindo a exibição do saldo total consolidado, quantidade de instituições bancárias conectadas e a lista detalhada de contas bancárias sincronizadas.

## What Changes

- **Backend API (`apps/api`)**:
  - Criação da rota autenticada `GET /api/accounts` (protegida por Supabase JWT) que consulta e retorna todas as contas bancárias sincronizadas do usuário autenticado (`pluggy_accounts`) unificadas com suas respectivas instituições (`pluggy_items`).
- **Tipos Compartilhados (`packages/types`)**:
  - Definição do schema Zod e tipos TypeScript para a resposta da listagem unificada de contas bancárias (`AccountWithConnectorDTO`, `AccountsListResponse`).
- **Frontend Web / PWA (`apps/web`)**:
  - Atualização do componente de página `apps/web/src/app/dashboard/page.tsx` para buscar dinamicamente as contas bancárias do usuário autenticado.
  - Cálculo e exibição dinâmica do Saldo Total Consolidado (somatório das contas correntes e desconto de faturas de cartão de crédito).
  - Exibição dinâmica da contagem e nomes das instituições financeiras conectadas.
  - Renderização de lista/grid de cards de contas conectadas com nome, tipo (ex: Conta Corrente, Cartão de Crédito), instituição bancária e saldo formatado em Real (BRL).
  - Atualização do componente `PluggyConnectButton` para disparar atualização automática da interface (`router.refresh()`) após sincronização de nova conta.
- **Testes Automatizados**:
  - Testes unitários no Vitest para schemas de contas e rotas do Fastify.
  - Teste E2E no Playwright validando a renderização dos cards de contas e saldo consolidado no dashboard.

## Capabilities

### New Capabilities
- `financial-dashboard`: Visualização consolidada de contas bancárias, saldo total disponível, listagem de instituições conectadas e cards de contas sincronizadas no Dashboard do Healthinance.

### Modified Capabilities
<!-- Nenhuma especificação de contrato anterior foi modificada -->

## Impact

- **Backend**: Nova rota `GET /api/accounts` em `apps/api/src/routes/accounts.ts` ou `apps/api/src/routes/pluggy.ts`.
- **Frontend**: `apps/web/src/app/dashboard/page.tsx` passa a ler dados dinâmicos do banco/API e renderizar lista de contas.
- **Database**: Consultas relacionais entre `pluggy_accounts` e `pluggy_items` utilizando Drizzle ORM.
- **Compatibilidade**: Totalmente retrocompatível com as rotas de sincronização existentes.
