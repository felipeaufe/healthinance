# Design: Infraestrutura de Testes (Vitest & Playwright)

## Context

O projeto Healthinance agora conta com arquitetura de monorepo, contratos compartilhados, API Fastify e telas de autenticação Next.js. De acordo com a seção 2.6 do `AGENTS.md`, a validação do comportamento do software deve ser garantida por testes automatizados antes de qualquer entrega ou arquivamento.

Ver `proposal.md` para motivação e `specs/testing-framework/spec.md` para requisitos funcionais.

## Goals / Non-Goals

**Goals:**
- Configurar **Vitest** como framework de testes unitários e de integração no monorepo (`packages/types` e `apps/api`).
- Configurar **Playwright** como framework de testes E2E em `apps/web`.
- Integrar as tarefas `test` e `test:e2e` ao `turbo.json` para caching inteligente e paralelismo.
- Implementar testes representativos para contratos Zod, endpoints Fastify e fluxos de navegação/redirecionamento no Next.js.

**Non-Goals:**
- Testes de carga ou benchmarking de alta concorrência nesta fase.
- Testes contra banco de dados real em produção (utilizar mocks ou chamadas simuladas nos testes unitários e ambiente local nos testes E2E).

## Decisions

### 1. Vitest sobre Jest
- **Decisão**: Adotar Vitest para testes unitários e de integração.
- **Racional**: Suporte nativo e instantâneo a TypeScript/ESM sem necessidade de Babel ou `ts-jest`, compatibilidade estrita com monorepo pnpm e execução ultrarrápida.
- **Alternativas consideradas**: Jest (lento com ESM/TypeScript e configuração pesada).

### 2. Playwright sobre Cypress
- **Decisão**: Adotar Playwright para testes End-to-End no `apps/web`.
- **Racional**: Arquitetura moderna sem injeção invasiva no DOM, suporte nativo a múltiplos navegadores (Chromium, WebKit, Firefox) e emulação de dispositivos mobile essencial para o foco PWA do Healthinance.
- **Alternativas consideradas**: Cypress (arquitetura mais pesada, suporte limitado a WebKit).

### 3. Configuração Modular por Workspace no Turborepo
- **Decisão**: Cada pacote/aplicação define seu próprio script `test` com Vitest, e o Turborepo orquestra via `turbo test`. O Playwright roda via `turbo test:e2e` específico para `apps/web`.
- **Racional**: Permite que desenvolvedores rodem testes rápidos de tipos/API sem precisar subir o servidor web do Playwright quando estiverem desenvolvendo backend, e vice-versa.

## Risks / Trade-offs

- **[Instalação de binários de navegadores do Playwright]** → O Playwright baixa binários de navegadores que podem consumir espaço e tempo. *Mitigação*: Configurar o Playwright inicialmente para focar em `chromium` no ambiente local/CI para máxima velocidade.
