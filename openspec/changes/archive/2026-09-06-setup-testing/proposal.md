# Proposta: Infraestrutura de Testes Automatizados (Vitest & Playwright)

## Why

Para garantir que todas as funcionalidades do Healthinance atendam aos contratos de negócio, segurança bancária e estabilidade de interface, conforme estabelecido no `AGENTS.md`, é necessário implantar uma suíte completa de testes automatizados:
1. **Vitest**: Testes unitários e de integração de execução veloz para schemas Zod, modelos de dados, endpoints do Fastify e serviços da Pluggy.
2. **Playwright**: Testes ponta a ponta (E2E) para garantir a navegação correta dos usuários no frontend Next.js/PWA, cobrindo telas de login, cadastro, recuperação de senha e redirecionamentos de proteção de rota.

## What Changes

- **Vitest (Testes Unitários & Integração)**:
  - Instalação e configuração do `vitest` nos pacotes `packages/types` e `apps/api`.
  - Implementação de testes unitários para os schemas Zod de contratos financeiros e eventos da Pluggy.
  - Implementação de testes de integração para as rotas da API Fastify (healthcheck, connect token, webhook).
- **Playwright (Testes End-to-End no Frontend Web)**:
  - Instalação e configuração de `@playwright/test` em `apps/web`.
  - Criação de `playwright.config.ts` com servidores de teste e viewports desktop/mobile.
  - Implementação de testes E2E cobrindo:
    - Redirecionamento de usuário não autenticado de `/dashboard` para `/login`.
    - Renderização e validação de campos nas telas `/login`, `/register` e `/forgot-password`.
    - Acionamento do botão do Pluggy Connect e feedback visual.
- **Orquestração Turborepo**:
  - Adição das pipelines `test` e `test:e2e` no `turbo.json` e scripts no `package.json` raiz.

## Capabilities

### New Capabilities
- `testing-framework`: Configuração de testes automatizados com Vitest (unitários e integração) e Playwright (E2E) integrados ao pipeline do Turborepo.

### Modified Capabilities
<!-- Nenhuma capacidade existente modificada -->

## Impact

- Adição de dependências de desenvolvimento (`vitest`, `@playwright/test`) no monorepo.
- Novos arquivos de teste em `packages/types/src/__tests__/`, `apps/api/src/__tests__/` e `apps/web/e2e/`.
- Novos scripts de pipeline: `pnpm test` e `pnpm test:e2e`.
