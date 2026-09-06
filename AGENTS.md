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

---

## 4. Política Estrita de Versionamento e Fluxo Git (GitHub CLI)

Esta política é de observância majoritária e mandatória para todo o ciclo de desenvolvimento:

### 4.1. Branch Base e Criação de Branches
- **Branch de Origem Obrigatória**: A branch base de todo o desenvolvimento é estritamente a **`develop`**. Nunca crie branches a partir da `main` ou de branches intermediárias.
- **Isolamento de Alterações**: Toda e qualquer alteração, correção ou nova funcionalidade DEVE ser realizada em uma branch própria criada a partir da `develop`:
  ```fish
  fish -l -c "git checkout develop && git pull origin develop && git checkout -b feat/<nome-da-change>"
  ```

### 4.2. Preferência Absoluta pelo GitHub CLI (`gh`)
- Todas as operações com o Git/GitHub devem priorizar ativamente o **GitHub CLI (`gh`)**.
- O uso de comandos `git` tradicionais no terminal é secundário e restrito a operações locais (`checkout`, `commit`, `branch -d`).

### 4.3. Encerramento do Fluxo OpenSpec e Abertura de PR
- Ao concluir a implementação e arquivamento do OpenSpec, envie a branch e **abra uma Pull Request apontando para a branch `develop`**:
  ```fish
  fish -l -c "git push -u origin <nome-da-branch>"
  fish -l -c "gh pr create --base develop --title 'feat: <descricao>' --body '<resumo-do-change>'"
  ```

### 4.4. Merge Estritamente sob Comando do Usuário
- **Ação Restrita**: O agente NUNCA deve fazer o merge da Pull Request de forma autônoma.
- O merge deve ser executado **exclusivamente sob comando explícito do usuário** (ex: *"faça o merge"*, *"pode mergear"*), aplicando o procedimento da skill `merge` ([.agent/skills/merge/SKILL.md](file:///home/felipe/Projects/meu-pluggy/healthinance/.agent/skills/merge/SKILL.md)):
  ```fish
  fish -l -c "gh pr merge --merge --delete-branch"
  ```
  *(A flag `--delete-branch` remove a branch remota no GitHub automaticamente).*

### 4.5. Retorno e Limpeza de Branches Locais
- Imediatamente após a confirmação do merge:
  1. Retornar à branch `develop` local:
     ```fish
     fish -l -c "git checkout develop"
     ```
  2. Atualizar a `develop` local com as novas mudanças:
     ```fish
     fish -l -c "git pull origin develop"
     ```
  3. Remover a branch local que foi mergeada e tornada obsoleta:
     ```fish
     fish -l -c "git branch -d <nome-da-branch-local>"
     ```
  4. Sincronizar poda de referências remotas:
     ```fish
     fish -l -c "git fetch --prune"
     ```

