# Proposta: Telas de Autenticação e Proteção de Rotas (Auth UI)

## Why

Para que a integração bancária da Pluggy opere de forma individualizada e segura, os usuários precisam ser capazes de se cadastrar, realizar login, recuperar acesso e encerrar suas sessões através de uma interface web e mobile (PWA) moderna conectada ao Supabase Auth.

A proteção de rotas garantirá que páginas privadas (como o Dashboard financeiro e a conexão bancária) sejam restritas a usuários autenticados, enquanto o token JWT da sessão é automaticamente transmitido para autenticar chamadas na API Fastify.

## What Changes

- **Páginas de Autenticação (`apps/web`)**:
  - `/login`: Formulário de login por email e senha com validação visual e links para cadastro e recuperação.
  - `/register`: Formulário de criação de conta com validação de força de senha e confirmação de cadastro.
  - `/forgot-password`: Fluxo de solicitação de recuperação de senha por email.
- **Proteção de Rotas (`middleware.ts`)**:
  - Redirecionamento automático de usuários não autenticados para `/login` ao tentarem acessar `/dashboard` ou rotas protegidas.
  - Redirecionamento de usuários já autenticados para `/dashboard` se tentarem acessar `/login` ou `/register`.
- **Área Protegida / Dashboard Base**:
  - Rota `/dashboard` exibindo o perfil do usuário logado, botão de Logout e integração com o `PluggyConnectButton`.
- **Comunicação Segura Frontend-Backend**:
  - Helper para injetar automaticamente o `access_token` JWT da sessão Supabase no header `Authorization: Bearer <token>` em requisições para a API Fastify (`apps/api`).

## Capabilities

### New Capabilities
- `auth-ui`: Telas de login, registro, recuperação de senha, gerenciamento de sessão e proteção de rotas no Next.js com Supabase Auth.

### Modified Capabilities
<!-- Nenhuma capacidade existente modificada -->

## Impact

- Novas rotas em `apps/web/src/app/(auth)/` e `apps/web/src/app/dashboard/`.
- Atualização das regras de matcher e verificação de usuário no `apps/web/src/middleware.ts`.
- Criação de helpers de requisição autenticada em `apps/web/src/lib/api.ts`.
