# Design: Telas de Autenticação e Proteção de Rotas (Auth UI)

## Context

O Healthinance utiliza Supabase Auth para gerenciar credenciais e sessões de usuários. É necessário fornecer a camada visual no frontend Next.js 15 (App Router) com Tailwind CSS e shadcn/ui styles para que os usuários possam se cadastrar, fazer login, recuperar senha e acessar o Dashboard protegido.

Ver `proposal.md` para motivação e `specs/auth-ui/spec.md` para os requisitos comportamentais.

## Goals / Non-Goals

**Goals:**
- Criar páginas responsivas e acessíveis em mobile/PWA para `/login`, `/register` e `/forgot-password`.
- Configurar o `apps/web/src/middleware.ts` com regras de proteção de rotas públicas vs privadas.
- Criar a página de `/dashboard` protegida com barra superior exibindo email do usuário e botão de logout.
- Criar utilitário `apiFetch` no frontend para injetar o header `Authorization: Bearer <token>` nas requisições à API Fastify.

**Non-Goals:**
- Configuração de login social (Google, GitHub) nesta etapa inicial (foco em email/senha robusto).
- Gerenciamento de múltiplos perfis ou permissões RBAC complexas.

## Decisions

### 1. Route Groups `(auth)` no Next.js App Router
- **Decisão**: Agrupar as rotas públicas de autenticação em `apps/web/src/app/(auth)/`.
- **Racional**: Permite compartilhar um layout minimalista e focado (cartão centralizado, logo do Healthinance, sem barra de navegação do dashboard).
- **Alternativas consideradas**: Rotas planas na raiz `/login` e `/register` sem layout compartilhado.

### 2. Client-Side Authentication com `@supabase/ssr`
- **Decisão**: Submissão de formulários via `createBrowserClient` do Supabase no cliente com gerenciamento automático de cookies httpOnly.
- **Racional**: Fornece feedback instantâneo de validação e loading no navegador do usuário, com atualização síncrona de estado.
- **Alternativas consideradas**: Server Actions exclusivas para cada campo (maior complexidade de feedback reativo).

### 3. Middleware Redirection com Validação de Sessão
- **Decisão**: Usar `supabase.auth.getUser()` dentro do `updateSession` no middleware Next.js.
- **Racional**: `getUser()` valida a autenticidade do token no servidor Supabase, garantindo que cookies adulterados não tenham acesso à rota `/dashboard`.

## Risks / Trade-offs

- **[Latência de rede no middleware]** → A validação com `getUser()` adiciona uma checagem rápida no middleware. *Mitigação*: O Supabase Auth valida o JWT e o Next.js roda em edge/node com cache eficiente.
