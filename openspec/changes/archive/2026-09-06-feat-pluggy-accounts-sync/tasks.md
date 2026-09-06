## 1. Contratos e Tipos Compartilhados (`packages/types`)

- [x] 1.1 Definir schema Zod e tipo `SyncItemResponseSchema` e parâmetros de requisição para sincronização de item
- [x] 1.2 Exportar os novos schemas no entrypoint de `@healthinance/types` e adicionar testes unitários correspondentes


## 2. Implementação do Backend Fastify (`apps/api`)

- [x] 2.1 Adicionar endpoint autenticado `POST /api/pluggy/items/:id/sync` em `apps/api/src/routes/pluggy.ts`
- [x] 2.2 Implementar verificação de propriedade do item no banco de dados (rejeitando com 403 Forbidden se pertencer a outro usuário)
- [x] 2.3 Integrar a rota ao serviço `syncItemData(itemId, userId)` com tratamento estruturado de erros e resposta padronizada


## 3. Integração no Frontend (`apps/web`)

- [x] 3.1 Atualizar `PluggyConnectButton.tsx` para chamar `POST /api/pluggy/items/:id/sync` no callback `onSuccess` com estado de carregamento visual
- [x] 3.2 Garantir tratamento amigável de erro caso a sincronização inicial falhe


## 4. Testes Automatizados e Validação

- [x] 4.1 Criar testes de integração com Vitest em `apps/api/src/__tests__/pluggy-sync.test.ts` cobrindo sincronização com sucesso, rejeição 401/403 e erro 500 da Pluggy API
- [x] 4.2 Executar a suíte completa de testes (`pnpm test`) e verificação de build com Turborepo (`pnpm build`)

