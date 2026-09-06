## Context

A infraestrutura básica do monorepo, autenticação frontend com Supabase e esqueleto de API Fastify com Drizzle e Pluggy SDK já estão estruturados. O usuário configurou as variáveis de ambiente com credenciais reais. Antes de iniciar o desenvolvimento das funcionalidades de negócio do produto Healthinance, é essencial garantir que a conexão física com o banco de dados PostgreSQL no Supabase esteja ativa com os schemas criados, e que as credenciais da Pluggy API estejam autenticadas e prontas para operação.

## Goals / Non-Goals

**Goals:**
- Sincronizar o schema relacional (`users`, `pluggy_items`, `pluggy_accounts`, `pluggy_transactions`) no PostgreSQL do Supabase via Drizzle ORM.
- Validar a conectividade ativa e credenciais da Pluggy API em ambiente de desenvolvimento/sandbox.
- Implementar utilitários de checagem de saúde e rota de diagnóstico `GET /health/connections` no Fastify.
- Criar testes automatizados com Vitest cobrindo os cenários de diagnóstico de conectividade (sucesso e degradação).

**Non-Goals:**
- Implementação de fluxos de produto, dashboards financeiros complexos, categorização ou sincronização de dados de produção do usuário.
- Modificação de telas ou componentes de UI além de meras verificações de conectividade.

## Decisions

### 1. Sincronização de Schema com Drizzle Kit Push
- **Decisão**: Utilizar `drizzle-kit push` para aplicar a definição do schema TypeScript diretamente no Supabase PostgreSQL.
- **Alternativa Considerada**: Migrações baseadas em arquivos SQL (`drizzle-kit generate` + scripts de migration).
- **Justificativa**: Na fase de infraestrutura inicial, `db:push` garante sincronia instantânea e precisa do schema sem complexidade desnecessária de histórico de migração SQL.

### 2. Separação entre Liveness Probe e Diagnostic Connections Probe
- **Decisão**: Manter `GET /health` como um healthcheck ultrarrápido (sem I/O de rede externo) e criar `GET /health/connections` para verificar explicitamente a conectividade com Supabase PostgreSQL (`SELECT 1`) e Pluggy API.
- **Alternativa Considerada**: Executar checagens de rede externas dentro do `GET /health` padrão.
- **Justificativa**: Probes de orquestração em servidores gratuitos (Render, Koyeb) exigem resposta em milissegundos sem falhar por oscilações transitórias de APIs de terceiros. A rota de conexões serve para monitoramento e validação controlada.

### 3. Validação Leve da Pluggy API via SDK
- **Decisão**: Utilizar `client.fetchConnectors({ sandbox: true })` ou criação de Connect Token de teste para validar a autenticidade das credenciais `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`.
- **Alternativa Considerada**: Apenas verificar se as variáveis de ambiente não estão vazias.
- **Justificativa**: Garantir que as credenciais fornecidas são válidas e possuem permissão de acesso ativa nos servidores da Pluggy antes de iniciar o desenvolvimento do produto.

## Risks / Trade-offs

- **[Transaction Pooler do Supabase (Porta 6543) com DDL]** → O `drizzle-kit push` executa comandos DDL (`CREATE TABLE`). Caso a connection string utilize a porta 6543 com Transaction Pooling estrito e barre comandos DDL, deve-se utilizar a porta 5432 (Session Mode ou Direct Connection) para o comando de push do Drizzle.
- **[Timeout de Conexão com Terceiros]** → Adicionar timeout de segurança (5s) nas checagens da rota `GET /health/connections` para evitar enfileiramento de requisições.
