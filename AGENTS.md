# Diretrizes Globais de Desenvolvimento Agêntico (Healthinance)

Este documento estabelece as regras e restrições obrigatórias para qualquer agente de IA ou desenvolvedor atuando no repositório **Healthinance**. A conformidade com estas diretrizes é estrita e mandatória.

---

## 1. Princípio Mandatório: Desenvolvimento Orientado a Especificações (OpenSpec)

> [!IMPORTANT]
> **Toda e qualquer alteração de código, refatoração ou adição de funcionalidade DEVE ser precedida e guiada pelo OpenSpec.** Nenhuma linha de código de produto deve ser escrita ou modificada de forma ad-hoc sem um change proposal correspondente.

### Ciclo de Vida Obrigatório de Mudanças:
1. **Criação do Change**: Iniciar via `fish -l -c "openspec new change <nome-da-mudanca>"`.
2. **Elaboração dos Artefatos de Planejamento**:
   - `proposal.md`: Define o *Porquê*, *O que muda*, *Capacidades (Novas/Modificadas)* e *Impacto*.
   - `specs/<capability>/spec.md`: Define o contrato de comportamento observável com `### Requirement` e `#### Scenario:` (usando estritamente 4 hashtags).
   - `design.md`: Justificativas técnicas, decisões arquiteturais, alternativas consideradas e mitigação de riscos.
   - `tasks.md`: Checklist atômica de tarefas sequenciais no formato `- [ ] X.Y Descrição`.
3. **Validação**: O change deve passar em `fish -l -c "openspec validate <nome-da-mudanca>"`.
4. **Execução (Apply)**: Implementar as tarefas marcando as caixas de seleção à medida que forem concluídas.
5. **Arquivamento**: Ao término da implementação e validação, consolidar o change com `fish -l -c "openspec archive <nome-da-mudanca>"`.

---

## 2. Governança da Arquitetura e Stack

A estrutura técnica do projeto foi desenhada para operação em **monorepo com servidores gratuitos (Node.js/TypeScript)** e deve ser rigorosamente respeitada:

### 2.1. Monorepo e Ferramentas de Linha de Comando
- **Gerenciador de Pacotes**: Estritamente **pnpm** com workspaces (`pnpm-workspace.yaml`). Não utilize `npm` ou `yarn`.
- **Monorepo Engine**: **Turborepo** (`turbo.json`) para orquestração e caching de pipelines (`build`, `dev`, `lint`).
- **Shell de Execução**: Comandos de terminal devem ser executados através do shell **fish** (`fish -l -c "<comando>"`) para preservar o ambiente e caminhos de ferramentas do usuário.

### 2.2. Frontend Web / PWA (`apps/web`)
- **Framework**: **Next.js (App Router)** com TypeScript.
- **Estilização & UI**: Tailwind CSS e componentes shadcn/ui.
- **Mobile-First & PWA**: A interface deve ser responsiva e manter suporte a PWA (`manifest.json`, ícones e viewport para mobile).
- **Autenticação**: Integrada com o **Supabase Auth** utilizando `@supabase/ssr` com cookies httpOnly seguros.
- **Pluggy Connect**: Abertura do widget de conexão bancária utilizando exclusivamente o `connectToken` gerado pelo backend.

### 2.3. Backend API (`apps/api`)
- **Framework**: **Fastify** com TypeScript.
  - *Restrição de Memória*: Fastify é mandatório para respeitar o limite de 512MB RAM dos servidores gratuitos (Render, Koyeb). Não substituir por NestJS ou frameworks pesados.
- **Proteção por JWT**: Endpoints autenticados devem validar o token JWT emitido pelo Supabase através de hook/decorator do Fastify.
- **Pluggy SDK**: Manipulação de credenciais da Pluggy (`CLIENT_ID` e `CLIENT_SECRET`), criação de Connect Tokens e sincronização de dados via `pluggy-sdk`.
- **Webhooks**: Receber eventos da Pluggy (`POST /api/webhooks/pluggy`), responder com `200 OK` imediatamente e disparar processamento em background.

### 2.4. Camada de Dados (`packages/database`)
- **Banco de Dados**: **PostgreSQL** hospedado no **Supabase**.
- **ORM**: **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`).
  - *Proibição do Prisma*: É proibido o uso do Prisma ORM neste projeto devido ao consumo de memória RAM da engine Rust em ambientes gratuitos.
- **Schemas**: Tabelas relacionais para `users`, `pluggy_items`, `pluggy_accounts` e `pluggy_transactions`.

### 2.5. Contratos e Tipos Compartilhados (`packages/types`)
- Única fonte de verdade para modelos de dados compartilhados entre frontend e backend.
- Schemas de validação com **Zod** e interfaces TypeScript exportadas para:
  - DTOs de autenticação.
  - Payloads de Connect Token, Itens, Contas e Transações da Pluggy.
  - Respostas padronizadas de API (`ApiResponse<T>`).

---

## 3. Regras Críticas de Segurança

1. **Segregação de Credenciais**:
   - `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` NUNCA devem ser importados, acessados ou expostos no pacote `apps/web` ou no bundle do navegador.
   - A chave de serviço (`service_role`) do Supabase só deve ser utilizada em tarefas administrativas seguras de backend, nunca no cliente.
2. **Variáveis de Ambiente**:
   - Sempre fornecer `.env.example` em `apps/web` e `apps/api` documentando as chaves necessárias sem dados sensíveis reais.
