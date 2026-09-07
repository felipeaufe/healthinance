## ADDED Requirements

### Requirement: Listagem e Filtro de Transações Financeiras no Backend
A API Fastify SHALL disponibilizar o endpoint autenticado `GET /api/transactions` protegido por Supabase JWT para retornar o extrato de transações financeiras vinculadas ao usuário autenticado, com suporte a paginação e filtro por conta.

#### Scenario: Consulta de transações por usuário autenticado
- **WHEN** um usuário autenticado realiza uma requisição `GET /api/transactions` com um Bearer JWT válido
- **THEN** a API SHALL responder com status HTTP 200 e um JSON contendo a lista de transações (incluindo `id`, `description`, `amount`, `date`, `category`, `type`, `accountId` e dados da conta associada), além do resumo de paginação

#### Scenario: Filtro de transações por conta bancária específica
- **WHEN** uma requisição `GET /api/transactions?accountId=:id` é enviada com o ID de uma conta pertencente ao usuário
- **THEN** a API SHALL retornar apenas as transações associadas à referida conta bancária

#### Scenario: Requisição sem token de autenticação
- **WHEN** uma requisição `GET /api/transactions` é realizada sem cabeçalho Authorization
- **THEN** a API SHALL responder com status HTTP 401 Unauthorized

### Requirement: Indicadores Financeiros Mensais no Dashboard
A aplicação SHALL calcular e exibir os indicadores consolidados do mês corrente no Dashboard: Total de Receitas do Mês, Total de Despesas do Mês e Resultado Líquido.

#### Scenario: Exibição dos indicadores do mês com movimentações
- **WHEN** o usuário possui transações registradas no mês corrente
- **THEN** o Dashboard SHALL apresentar o valor total de receitas (soma dos créditos), o valor total de despesas (soma dos débitos) e o balanço líquido formatados em Real (BRL)

#### Scenario: Usuário sem transações no mês corrente
- **WHEN** o usuário não possui transações cadastradas no mês atual
- **THEN** o Dashboard SHALL apresentar os indicadores zerados ("R$ 0,00") de forma clara e legível

### Requirement: Feed e Visualização do Extrato no Dashboard
A seção "Extrato de Transações" do Dashboard SHALL apresentar a lista cronológica das últimas transações do usuário, destacando categoria, conta de origem, data e valor monetário.

#### Scenario: Renderização do extrato com transações
- **WHEN** o usuário autenticado acessa o Dashboard e possui transações cadastradas
- **THEN** o extrato SHALL renderizar cada transação com data formatada (DD/MM/AAAA), descrição, badge da categoria ou banco de origem, e valor estilizado com diferenciação de cor (verde para receitas/créditos e vermelho para despesas/débitos)

#### Scenario: Estado vazio quando não houver transações
- **WHEN** o usuário acessa o Dashboard e não possui transações registradas
- **THEN** o extrato SHALL exibir uma mensagem amigável e informativa explicando que as movimentações aparecerão assim que houver transações nas contas conectadas
