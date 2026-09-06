# Design: Healthinance Monorepo Architecture

## Context

O Healthinance necessita de uma estrutura inicial limpa e escalável para conectar contas bancárias de usuários via Pluggy API e fornecer visualização financeira em Web/PWA, com planos de expansão para mobile. Ver `proposal.md` para motivação e `specs/` para requisitos funcionais.

Restrições técnicas principais:
- Hospedagem gratuita inicial em serviços com limites de memória (512MB RAM no Render/Koyeb).
- Uso estrito de Node.js v24+, TypeScript, pnpm e Turborepo.
- Segregação de credenciais sensíveis (Pluggy Client Secret nunca exposto no browser).
- Autenticação delegada ao Supabase Auth.

## Goals / Non-Goals

**Goals:**
- Configurar Turborepo com pnpm workspaces vinculando `apps/web`, `apps/api` e `packages/*`.
- Configurar camada de persistência com Drizzle ORM voltada para PostgreSQL do Supabase.
- Implementar plugin de autenticação Fastify que valida o token JWT do Supabase.
- Estruturar serviços de integração com a Pluggy API (`pluggy-sdk`) para geração de Connect Token e recepção de Webhooks.
- Configurar base Next.js 15 App Router com Tailwind CSS e PWA manifest inicial.

**Non-Goals:**
- Desenvolvimento de fluxos complexos de categorização manual de transações nesta fase inicial de setup.
- Publicação de apps nativos em lojas da Apple/Google (nesta etapa o foco mobile é PWA).
- Configuração de filas Redis dedicadas no setup zero (utilizar processamento assíncrono direto ou Inngest serverless).

## Decisions

### 1. Drizzle ORM sobre Prisma
- **Decisão**: Utilizar Drizzle ORM em `packages/database`.
- **Racional**: O Prisma executa uma engine em Rust que consome entre 100MB e 150MB de RAM, o que compromete containers com limite de 512MB no tier gratuito do Render/Koyeb. O Drizzle é puro TypeScript/SQL, consome menos de 10MB de RAM e gera tipagem estrita com zero overhead.
- **Alternativas consideradas**: Prisma ORM, Kysely, TypeORM.

### 2. Fastify sobre Express / NestJS para o Backend
- **Decisão**: Fastify com TypeScript em `apps/api`.
- **Racional**: O Fastify tem inicialização quase instantânea, menor footprint de memória e suporta validação de esquemas JSON de alta performance.
- **Alternativas consideradas**: NestJS (muito pesado para o free tier), Express (antigo, sem tipagem assíncrona moderna nativa).

### 3. Autenticação Híbrida (Supabase Auth no Web + JWT Guard no Fastify)
- **Decisão**: Usuário autentica no frontend Next.js usando `@supabase/ssr` e envia o `access_token` no header `Authorization: Bearer <token>` para o Fastify.
- **Racional**: Supabase Auth fornece 50.000 MAU gratuitos, eliminando a necessidade de gerenciar senhas, hash bcrypt e resets de senha no backend. O Fastify valida a assinatura do JWT emitido pelo Supabase de forma rápida.
- **Alternativas consideradas**: Auth0 (limite grátis menor), NextAuth / Auth.js (depende de banco compartilhado e sessão acoplada ao Next.js).

### 4. Pacote `@healthinance/types` como Fonte Única de Verdade
- **Decisão**: Definir contratos de dados (Zod schemas e TypeScript types) em `packages/types` compartilhados entre `apps/web` e `apps/api`.
- **Racional**: Evita divergências entre frontend e backend no tratamento das respostas da Pluggy e estruturas de transações.

## Risks / Trade-offs

- **[Cold start em servidores gratuitos]** → O Render coloca o container para dormir após 15 minutos de inatividade. *Mitigação*: Manter endpoints leves com Fastify para inicialização rápida (<3s) e orientar uso de cron pings se necessário.
- **[Webhook timeouts da Pluggy]** → A Pluggy espera resposta rápida (HTTP 200) nos webhooks. Se o processamento de muitas transações demorar, pode ocorrer timeout. *Mitigação*: Responder 200 OK imediatamente no endpoint do webhook e processar a sincronização assincronamente em background.
