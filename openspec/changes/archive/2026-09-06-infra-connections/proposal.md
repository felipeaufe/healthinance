## Why

Antes de iniciar a implementação das regras e lógicas de negócio do produto Healthinance, é necessário assegurar que toda a infraestrutura base esteja provisionada, conectada e funcional com os serviços externos reais (PostgreSQL no Supabase via Drizzle ORM e Open Finance API da Pluggy). Estabelecer e validar essas conexões previne falhas silenciosas de credenciais, rede ou tipagem de banco durante o ciclo de desenvolvimento das funcionalidades.

## What Changes

- **Sincronização de Banco (Drizzle Push)**: Executar e validar a aplicação do schema relacional (`users`, `pluggy_items`, `pluggy_accounts`, `pluggy_transactions`) no PostgreSQL do Supabase via `drizzle-kit push`.
- **Validação de Conectividade com a Pluggy API**: Testar a autenticação de credenciais (`PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`) e a emissão de Connect Token através de teste/rotina de integridade.
- **Endpoint / Rotina de Diagnóstico de Infraestrutura**: Criar endpoint seguro ou utilitário de healthcheck em `apps/api` (`GET /health/connections`) para checar a saúde ativa da conexão com o banco de dados e a conectividade com a Pluggy.
- **Testes de Integração e Conectividade**: Testes automatizados com Vitest cobrindo a verificação de saúde das conexões.

## Capabilities

### New Capabilities
- `infra-connectivity`: Validação ativa e monitoramento da integridade de conexão entre a API Fastify, o banco de dados PostgreSQL (Supabase) e a API da Pluggy.

### Modified Capabilities
<!-- Nenhuma alteração em requisitos existentes -->

## Impact

- **Banco de Dados**: Criação física das tabelas no Supabase PostgreSQL.
- **Backend API (`apps/api`)**: Adição de rota de diagnóstico de conexões e testes de integração.
- **Segurança**: Credenciais lidas exclusivamente das variáveis de ambiente no servidor sem exposição ao frontend.
