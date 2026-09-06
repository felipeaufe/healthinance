# financial-dashboard Specification

## Purpose
Permite que os usuários visualizem de forma centralizada e em tempo real suas contas bancárias sincronizadas, o saldo total disponível e as instituições financeiras conectadas no Dashboard do Healthinance.

## Requirements

### Requirement: Listagem Unificada de Contas Bancárias no Backend
A API Fastify SHALL disponibilizar o endpoint autenticado `GET /api/accounts` protegido por Supabase JWT para retornar a lista de contas bancárias ativas vinculadas ao usuário autenticado, incluindo os dados da instituição bancária conectada.

#### Scenario: Requisição com sucesso por usuário autenticado
- **WHEN** um usuário autenticado envia uma requisição `GET /api/accounts` com um Bearer JWT válido
- **THEN** a API SHALL responder com status HTTP 200 e um JSON contendo a lista de contas (`id`, `name`, `balance`, `currencyCode`, `type`, `subtype`, `connectorName`) e o somatório consolidado dos saldos

#### Scenario: Requisição sem token de autenticação
- **WHEN** uma requisição `GET /api/accounts` é realizada sem cabeçalho Authorization
- **THEN** a API SHALL responder com status HTTP 401 Unauthorized

### Requirement: Exibição Dinâmica do Saldo e Instituições no Dashboard
O Dashboard do Next.js SHALL calcular e renderizar o Saldo Total Disponível e a quantidade de instituições conectadas com base nos dados reais do usuário.

#### Scenario: Usuário com contas sincronizadas
- **WHEN** o usuário autenticado acessa o Dashboard e possui contas sincronizadas no banco de dados
- **THEN** a interface SHALL exibir no card "Saldo Total Disponível" a soma formatada em Real (BRL) e no card "Instituições Conectadas" a quantidade correta de bancos distintos conectados

#### Scenario: Usuário sem contas bancárias sincronizadas
- **WHEN** o usuário autenticado acessa o Dashboard e não possui nenhuma conta bancária conectada
- **THEN** a interface SHALL exibir saldo "R$ 0,00", "0 bancos" e o estado vazio informativo encorajando a conexão

### Requirement: Renderização dos Cards de Contas Bancárias
A interface do Dashboard SHALL apresentar uma seção dedicada com os cards de cada conta bancária conectada pelo usuário.

#### Scenario: Visualização dos detalhes da conta bancária
- **WHEN** as contas do usuário são carregadas no Dashboard
- **THEN** cada card SHALL apresentar o nome da conta, o tipo de conta (ex: Conta Corrente ou Cartão de Crédito), a instituição financeira emissora e o saldo individual
