## 1. Conexão e Sincronização do Banco de Dados (PostgreSQL / Supabase)

- [x] 1.1 Executar sincronização do schema Drizzle no Supabase PostgreSQL via `pnpm --filter @healthinance/database db:push`
- [x] 1.2 Implementar função helper `checkDatabaseConnection` no pacote `@healthinance/database` para validação ativa com `SELECT 1`



## 2. Conectividade e Validação da Pluggy API

- [x] 2.1 Implementar função helper `checkPluggyConnection` em `apps/api/src/services/pluggy.ts` para testar autenticação do SDK
- [x] 2.2 Validar geração de Connect Token de teste sem persistência para comprovar credenciais ativas


## 3. Diagnóstico e Rota de Monitoramento no Fastify

- [x] 3.1 Adicionar rota `GET /health/connections` em `apps/api/src/routes/health.ts` reportando status de PostgreSQL e Pluggy
- [x] 3.2 Criar testes automatizados com Vitest em `apps/api/src/__tests__/routes.test.ts` cobrindo cenários de sucesso (200 OK) e degradação (503 Service Unavailable)


## 4. Validação e Conformidade

- [x] 4.1 Executar testes unitários e de integração com Vitest (`pnpm test`)
- [x] 4.2 Executar build e checagem de tipos em todo o monorepo via Turborepo (`pnpm build`)

