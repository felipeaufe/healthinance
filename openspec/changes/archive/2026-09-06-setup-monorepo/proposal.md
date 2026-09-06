# Proposta: Inicialização do Monorepo Healthinance

## Why

O Healthinance precisa de uma arquitetura sólida, modular e eficiente em consumo de recursos para suportar integração com a API da Pluggy (Open Finance), sincronização de transações financeiras, autenticação segura via Supabase e suporte a web e futuro mobile/PWA com custo zero de infraestrutura.

A criação inicial de um monorepo com Turborepo e pnpm garante o compartilhamento eficiente de tipos TypeScript, esquemas de banco de dados e contratos entre o frontend e a API, mantendo o backend Fastify enxuto e isolado para processamento de webhooks e dados bancários.

## What Changes

- **Monorepo Root**: Configuração do `pnpm-workspace.yaml`, `turbo.json`, `package.json` raiz e `.gitignore`.
- **Packages Compartilhados**:
  - `packages/tsconfig`: Configurações TypeScript base reutilizáveis.
  - `packages/types`: Schemas Zod e tipos TypeScript para autenticação, Pluggy (itens, contas, transações, connect tokens) e respostas de API.
  - `packages/database`: Schemas do Drizzle ORM para PostgreSQL (Supabase), migrações e cliente unificado.
- **Backend Fastify (`apps/api`)**:
  - Servidor Fastify estruturado em TypeScript com suporte a CORS e logging.
  - Middleware/Plugin de autenticação validando o JWT do Supabase.
  - Rota `POST /api/pluggy/connect-token` para gerar tokens temporários com o Pluggy SDK.
  - Rota `POST /api/webhooks/pluggy` para receber eventos da Pluggy (`item/created`, `item/updated`, etc.).
  - Rotas financeiras `GET /api/accounts` e `GET /api/transactions`.
- **Frontend Next.js (`apps/web`)**:
  - Next.js 15 com App Router e Tailwind CSS.
  - Integração com `@supabase/ssr` para autenticação baseada em cookies seguros.
  - Suporte inicial a PWA (`manifest.json`).
  - Interface base de Dashboard e componente para acionar o Pluggy Connect Widget.

## Capabilities

### New Capabilities
- `monorepo-workspace`: Estrutura do monorepo gerenciada por Turborepo e pnpm, com scripts de build, dev e lint compartilhados.
- `auth-and-db`: Camada de banco de dados com Drizzle ORM e integração com autenticação do Supabase.
- `pluggy-integration`: Integração segura do backend com a Pluggy API (Connect Tokens, Webhooks e sincronização de dados financeiros).

### Modified Capabilities
<!-- Nenhuma capacidade existente modificada (projeto novo) -->

## Impact

- Criação de toda a árvore de diretórios em `apps/` e `packages/`.
- Dependência do runtime Node.js v24+, pnpm 11+ e fish shell.
- Arquivos de variáveis de ambiente (`.env.example`) definidos para o frontend e backend.
