## 1. Monorepo Foundation

- [x] 1.1 Configurar `pnpm-workspace.yaml`, `turbo.json`, `package.json` raiz e `.gitignore`
- [x] 1.2 Criar pacote `packages/tsconfig` com configurações base para Node, Next.js e bibliotecas
- [x] 1.3 Criar pacote `packages/types` com schemas Zod e contratos TypeScript (Pluggy, Auth, Finance)

## 2. Database & Supabase Layer

- [x] 2.1 Criar pacote `packages/database` com cliente Drizzle ORM para PostgreSQL (Supabase)
- [x] 2.2 Modelar schemas do banco para `users`, `pluggy_items`, `pluggy_accounts` e `pluggy_transactions`
- [x] 2.3 Configurar scripts de migração e exportação de tipos inferidos do Drizzle

## 3. Backend Fastify API

- [x] 3.1 Criar estrutura de `apps/api` com Fastify, TypeScript, CORS e scripts de inicialização
- [x] 3.2 Implementar decorator/hook de autenticação para validar JWT emitido pelo Supabase
- [x] 3.3 Implementar rotas de integração com a Pluggy (`POST /api/pluggy/connect-token` e `POST /api/webhooks/pluggy`)
- [x] 3.4 Implementar rotas de consulta financeira (`GET /api/accounts` e `GET /api/transactions`)

## 4. Frontend Next.js Web/PWA

- [x] 4.1 Inicializar estrutura de `apps/web` com Next.js 15 App Router, Tailwind CSS e TypeScript
- [x] 4.2 Configurar integração com Supabase Auth via `@supabase/ssr` (client, server e middleware)
- [x] 4.3 Configurar manifesto PWA (`manifest.json`) e meta tags responsivas para suporte mobile
- [x] 4.4 Criar tela inicial com status de conexão e acionamento do Pluggy Connect Widget

## 5. Verification & Monorepo Validation

- [x] 5.1 Executar resolução de dependências com `pnpm install`
- [x] 5.2 Executar build integrado do monorepo com `pnpm turbo build`
- [x] 5.3 Validar conformidade do change com `openspec validate setup-monorepo`
