## Purpose

Provê mecanismos de verificação, monitoramento de integridade e validação ativa de conectividade entre a API do Healthinance, o banco de dados PostgreSQL (Supabase) e a API da Pluggy Open Finance.

## ADDED Requirements

### Requirement: Database connectivity and schema synchronization
O sistema SHALL estabelecer conexão segura com o banco PostgreSQL no Supabase e garantir que as tabelas essenciais existam e respondam a consultas de integridade.

#### Scenario: Database schema synchronization
- **WHEN** a ferramenta de sincronização de banco de dados (`db:push`) é executada com a `DATABASE_URL` configurada
- **THEN** as tabelas relacionais do sistema (`users`, `pluggy_items`, `pluggy_accounts`, `pluggy_transactions`) MUST ser criadas ou sincronizadas no PostgreSQL sem erros.

#### Scenario: Database ping query succeeds
- **WHEN** a API Fastify executa uma consulta de integridade (`SELECT 1`) no banco de dados
- **THEN** a resposta MUST retornar sucesso indicando que o pooler PostgreSQL está ativo e aceitando conexões.

### Requirement: Pluggy API connectivity verification
O backend API SHALL validar a integridade das credenciais de comunicação com a Pluggy API e confirmar a capacidade de gerar tokens de integração.

#### Scenario: Pluggy API authentication and connectors probe
- **WHEN** o serviço de integração da Pluggy realiza uma chamada de verificação à API externa com credenciais válidas
- **THEN** a resposta MUST retornar status de sucesso e comunicação autenticada confirmada.

#### Scenario: Test connect token generation
- **WHEN** uma solicitação de emissão de Connect Token de teste é efetuada através do Pluggy SDK
- **THEN** a Pluggy API MUST emitir uma string de `accessToken` válida.

### Requirement: System connections healthcheck endpoint
A API Fastify SHALL expor uma rota de diagnóstico para verificar o estado operacional de todas as conexões externas de infraestrutura.

#### Scenario: Live connections health check reports healthy services
- **WHEN** um cliente realiza uma requisição `GET /health/connections`
- **THEN** a API MUST verificar o banco de dados e a conectividade com a Pluggy, respondendo com HTTP 200 OK e JSON detalhando o status de cada serviço (`database: connected`, `pluggy: connected`).

#### Scenario: Downstream service failure reports unhealthy status
- **WHEN** o banco de dados ou a API da Pluggy estiver inacessível durante a checagem em `GET /health/connections`
- **THEN** a API MUST responder com HTTP 503 Service Unavailable e JSON identificando o serviço com falha e a mensagem de erro correspondente.
