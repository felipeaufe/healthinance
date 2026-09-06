# Design Técnico: Sincronização Pluggy (feat-pluggy-accounts-sync)

## Context

Atualmente, o backend Fastify possui o serviço `syncItemData(itemId, userId)` implementado em `apps/api/src/services/pluggy.ts` e escuta webhooks em `POST /api/webhooks/pluggy`. No entanto, não há endpoint HTTP exposto para permitir que o cliente ou o frontend dispare a sincronização sob demanda após conectar uma conta no widget `PluggyConnectButton`.

Restrições técnicas:
- Backend Fastify rodando com limite de memória estrito ($\le 512$MB RAM).
- Autenticação obrigatória via Supabase JWT em rotas de usuário.
- Drizzle ORM para persistência no PostgreSQL do Supabase.

## Goals / Non-Goals

**Goals:**
- Expor endpoint autenticado `POST /api/pluggy/items/:id/sync` em `apps/api/src/routes/pluggy.ts`.
- Validar que o `itemId` pertence ao usuário autenticado (ou registrar para o usuário autenticado caso seja uma nova conexão vinda do widget).
- Executar a sincronização idempotente de itens, contas e transações da Pluggy para o PostgreSQL.
- Acionar a sincronização no frontend `PluggyConnectButton.tsx` no evento `onSuccess`.
- Cobertura de testes unitários e de integração com Vitest mockando a SDK da Pluggy.

**Non-Goals:**
- Criação de tabelas de contas manuais (`manual_accounts`) e categorias — escopo do change `feat-manual-accounts`.
- Lançamentos manuais de transações e extrato unificado — escopo do change `feat-transactions-crud`.
- Gráficos Recharts e métricas avançadas no Dashboard — escopo do change `feat-dashboard-metrics`.

## Decisions

### 1. Endpoint `POST /api/pluggy/items/:id/sync` com Verificação de Posse
- **Decisão**: A rota verifica no banco se o item já existe:
  - Se existir: valida se `item.userId === request.user.sub`. Caso pertença a outro usuário, retorna `403 Forbidden`.
  - Se não existir (item recém-criado no widget pelo usuário): associa o item ao `request.user.sub` e efetua a carga inicial completa.
- **Alternativa considerada**: Exigir uma rota separada `POST /api/pluggy/items` para criar e outra para sincronizar. Descartado por adicionar roundtrips desnecessários no fluxo do widget.

### 2. Idempotência com Drizzle ORM
- **Decisão**:
  - `pluggy_items`: `onConflictDoUpdate` atualizando status, erro e `lastUpdatedAt`.
  - `pluggy_accounts`: `onConflictDoUpdate` atualizando nome, saldo e `updatedAt`.
  - `pluggy_transactions`: `onConflictDoNothing` indexado pelo ID único da transação da Pluggy, prevenindo duplicidades.

### 3. Integração Transparente no `PluggyConnectButton`
- **Decisão**: Ao receber o callback `onSuccess({ item })`, o botão entra em estado de sincronização visual (`Sincronizando dados bancários...`), chama `POST /api/pluggy/items/${item.id}/sync` e, em seguida, dispara o callback `onSuccess` original para que o Dashboard recarregue os dados.
- **Alternativa considerada**: Depender puramente de webhooks assíncronos. Descartado porque webhooks podem ter delay de entrega da Pluggy para o ambiente local/dev, gerando má experiência ao usuário imediata.

### 4. Mocks Determinísticos no Vitest
- **Decisão**: Utilizar `vi.mock('pluggy-sdk')` para simular respostas dos métodos `fetchItem`, `fetchAccounts` e `fetchTransactions`, testando tanto caminhos felizes quanto erros sem gerar custos ou dependência de rede externa durante CI/CD.

## Risks / Trade-offs

- **[Risco]** Instabilidade ou timeout na chamada da Pluggy API durante o sync sob demanda.
  - **Mitigação**: O Fastify responderá com erro 500 estruturado sem derrubar o processo; os dados parciais (ex: item e contas) são salvos de forma atômica/idempotente.
- **[Risco]** Volume elevado de transações em contas com muito histórico.
  - **Mitigação**: A SDK busca as transações recentes da conta e a inserção é feita por lotes ou iteração controlada em memória para não estourar os 512MB RAM.
