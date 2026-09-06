## Purpose

Provides automated unit, integration, and end-to-end testing infrastructure using Vitest and Playwright integrated with Turborepo pipelines.

## ADDED Requirements

### Requirement: Unit and integration testing with Vitest
The repository SHALL execute unit and integration test suites using Vitest across shared packages and backend services.

#### Scenario: Running unit tests on types and schemas
- **WHEN** the developer executes `pnpm test` in `packages/types`
- **THEN** Vitest MUST validate that Zod schemas for Pluggy items, webhooks, accounts, and transactions correctly accept valid payloads and reject invalid payloads.

#### Scenario: Running integration tests on API endpoints
- **WHEN** the developer executes `pnpm test` in `apps/api`
- **THEN** Vitest MUST verify that Fastify routes return expected HTTP responses (e.g. 200 on healthcheck, 400 on invalid webhook payloads, 401 on unauthenticated requests).

### Requirement: End-to-end testing with Playwright
The repository SHALL execute browser-level E2E tests using Playwright against the Next.js web application.

#### Scenario: Running auth flow and route guard tests
- **WHEN** the developer executes `pnpm test:e2e` in `apps/web`
- **THEN** Playwright MUST launch a headless browser, verify that accessing `/dashboard` redirects unauthenticated users to `/login`, and verify that form fields render and validate properly on `/login`, `/register`, and `/forgot-password`.

### Requirement: Workspace test pipeline orchestration
Turborepo SHALL coordinate test execution across all workspaces through unified root commands.

#### Scenario: Running test pipeline from repository root
- **WHEN** the developer executes `pnpm test` at the repository root
- **THEN** Turborepo MUST run Vitest across all configured workspaces and report aggregated pass/fail results.
