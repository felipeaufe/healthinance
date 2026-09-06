# Proposta: Sincronização de Contas e Transações Pluggy (feat-pluggy-accounts-sync)

## Why

Atualmente, a aplicação possui endpoints base para geração de Connect Token e webhook, porém não disponibiliza um endpoint autenticado para sincronização sob demanda (`POST /api/pluggy/items/:id/sync`) após a conclusão do fluxo no widget Connect, nem aciona a sincronização imediata no frontend após o usuário conectar sua instituição bancária.

Este change implementa a camada completa de sincronização do Open Finance via Pluggy (item, contas e transações), garantindo que os dados bancários sejam persistidos no banco de dados Supabase via Drizzle ORM assim que o usuário conecta um banco ou quando eventos de atualização ocorrem.

## What Changes

- **Endpoint de Sincronização sob Demanda (`apps/api`)**:
  - Implementar `POST /api/pluggy/items/:id/sync` protegido por Supabase JWT.
  - Validar autorização do usuário e disparar `syncItemData(itemId, userId)` para atualizar o item, suas contas e transações.
  - Tratar erros da API Pluggy e retornar respostas padronizadas.
- **Robustez do Listener de Webhooks (`apps/api`)**:
  - Garantir o tratamento em background de webhooks para itens cadastrados, com logs estruturados e resiliência a falhas de rede.
- **Integração no Frontend (`apps/web`)**:
  - No callback `onSuccess` do componente `PluggyConnectButton`, disparar chamada automática para `/api/pluggy/items/:id/sync` garantindo a persistência imediata antes de recarregar a interface.
- **Testes Automatizados (Vitest)**:
  - Criar suíte de testes de integração cobrindo `POST /api/pluggy/items/:id/sync`, validação de autenticação, simulação de sucesso e erro da Pluggy API com mocks.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capacidade necessária; expande a especificação pluggy-integration -->

### Modified Capabilities
- `pluggy-integration`: Adição de requisito de sincronização sob demanda (`POST /api/pluggy/items/:id/sync`) com validação de vínculo do usuário e processamento imediato pós-conexão.

## Impact

- **Backend API (`apps/api`)**:
  - Nova rota em `routes/pluggy.ts`.
  - Melhorias e tipagem em `services/pluggy.ts`.
- **Frontend (`apps/web`)**:
  - `PluggyConnectButton.tsx` sincroniza ativamente o item recém-conectado com a API.
- **Tipos Compartilhados (`packages/types`)**:
  - DTO e schemas Zod para respostas de sincronização (`SyncItemResponseSchema`).
- **Segurança**:
  - O endpoint de sincronização garante que um usuário só pode sincronizar seus próprios itens.
