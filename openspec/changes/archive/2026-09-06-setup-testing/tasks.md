## 1. Vitest Setup & Unit Tests

- [x] 1.1 Adicionar `vitest` como dependência e configurar scripts de teste em `packages/types` e `apps/api`
- [x] 1.2 Implementar testes unitários para schemas Zod em `packages/types/src/__tests__/schemas.test.ts`
- [x] 1.3 Implementar testes de integração para endpoints Fastify em `apps/api/src/__tests__/routes.test.ts`

## 2. Playwright Setup & E2E Tests

- [x] 2.1 Adicionar `@playwright/test` e criar `apps/web/playwright.config.ts`
- [x] 2.2 Implementar testes E2E para telas de autenticação e proteção de rota em `apps/web/e2e/auth.spec.ts`

## 3. Monorepo Pipeline & Validation

- [x] 3.1 Adicionar pipelines `test` e `test:e2e` no `turbo.json` e scripts no `package.json` raiz
- [x] 3.2 Executar suíte de testes unitários com `pnpm test`
- [x] 3.3 Executar suíte de testes E2E com `pnpm test:e2e`
- [x] 3.4 Validar conformidade do change com `openspec validate setup-testing`
