## ADDED Requirements

### Requirement: On-demand item data synchronization
The backend API SHALL expose an authenticated endpoint `POST /api/pluggy/items/:id/sync` allowing users to synchronize their bank accounts and recent transactions from Pluggy into the database.

#### Scenario: User triggers sync for connected item
- **WHEN** an authenticated user sends a `POST /api/pluggy/items/:id/sync` request with a valid Supabase JWT and itemId
- **THEN** the API MUST fetch updated item, accounts, and transactions data from Pluggy API, persist them in the database, and return HTTP 200 with `{ success: true, message: "Item sincronizado com sucesso" }`.

#### Scenario: User attempts to sync an item belonging to another user
- **WHEN** an authenticated user calls `POST /api/pluggy/items/:id/sync` for an item registered to a different `userId`
- **THEN** the API MUST reject the request with HTTP 403 Forbidden and not modify or expose data.

#### Scenario: Sincronização falha devido a erro na Pluggy API
- **WHEN** a chamada ao serviço Pluggy falha por instabilidade ou token inválido
- **THEN** a API MUST registrar o erro nos logs estruturados e responder com HTTP 500 e mensagem explicativa.

### Requirement: Post-connect immediate synchronization
The frontend Pluggy Connect widget SHALL trigger an immediate synchronization request to `POST /api/pluggy/items/:id/sync` upon successful connection completion.

#### Scenario: Widget finishes connection successfully
- **WHEN** the user completes bank credentials login in the Pluggy Connect widget and the `onSuccess` callback fires with `itemId`
- **THEN** the frontend MUST send an authenticated request to `POST /api/pluggy/items/:id/sync` to persist item and financial data in Supabase before refreshing user accounts.
