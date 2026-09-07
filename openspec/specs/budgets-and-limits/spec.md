# budgets-and-limits Specification

## Purpose
Permite que os usuários definam tetos de gastos mensais por categoria, acompanhem o consumo em tempo real através de um termômetro visual e monitorem o ritmo diário seguro de gastos ("Safe to Spend") para prevenir estouros orçamentários.

## Requirements

### Requirement: Gestão de Orçamentos por Categoria no Backend
A API Fastify SHALL disponibilizar endpoints autenticados protegidos por Supabase JWT para criação, listagem, atualização e remoção de orçamentos mensais vinculados ao usuário autenticado.

#### Scenario: Criação de orçamento mensal
- **WHEN** um usuário autenticado envia uma requisição `POST /api/budgets` com `category`, `amount`, `periodMonth` e `periodYear` válidos
- **THEN** a API SHALL persistir o orçamento e responder com status HTTP 201 Created e os dados do orçamento criado

#### Scenario: Consulta de orçamentos com consumo em tempo real
- **WHEN** um usuário autenticado envia uma requisição `GET /api/budgets`
- **THEN** a API SHALL responder com status HTTP 200 OK e a lista de orçamentos do mês corrente, contendo para cada um: teto configurado, valor total consumido no mês, percentual atingido e valor do Safe to Spend diário

#### Scenario: Atualização de teto orçamentário
- **WHEN** um usuário autenticado envia uma requisição `PUT /api/budgets/:id` com novo valor de `amount`
- **THEN** a API SHALL atualizar o orçamento correspondente pertencente ao usuário e retornar status HTTP 200 OK

#### Scenario: Exclusão de orçamento
- **WHEN** um usuário autenticado envia uma requisição `DELETE /api/budgets/:id`
- **THEN** a API SHALL remover o orçamento e responder com status HTTP 200 OK

#### Scenario: Requisição sem token de autenticação
- **WHEN** qualquer endpoint de orçamentos é chamado sem cabeçalho Authorization
- **THEN** a API SHALL responder com status HTTP 401 Unauthorized

### Requirement: Cálculo do Indicador Safe to Spend (Ritmo Diário Seguro)
O sistema SHALL calcular dinamicamente o valor máximo que o usuário pode gastar por dia na categoria até o encerramento do mês sem ultrapassar o teto estipulado.

#### Scenario: Cálculo do ritmo diário dentro do limite
- **WHEN** o valor consumido na categoria for inferior ao teto orçamentário e houver dias restantes no mês
- **THEN** o sistema SHALL calcular o Safe to Spend como `(teto - consumido) / dias_restantes` e disponibilizar esse valor na resposta

#### Scenario: Categoria com teto orçamentário ultrapassado
- **WHEN** o valor consumido na categoria for igual ou superior ao teto estipulado (consumo >= 100%)
- **THEN** o Safe to Spend diário SHALL ser igual a 0,00 e o status de alerta SHALL indicar estouro orçamentário

### Requirement: Visualização do Termômetro Orçamentário no Frontend
A interface do usuário SHALL exibir os orçamentos do mês corrente com barras de progresso visuais com cores baseadas no percentual consumido.

#### Scenario: Cores de alerta do termômetro
- **WHEN** os orçamentos são renderizados na interface
- **THEN** a barra de progresso SHALL apresentar cor verde para consumo até 70%, amarela para consumo entre 71% e 90%, e vermelha para consumo acima de 90% ou estouro

#### Scenario: Estado vazio quando não houver orçamentos cadastrados
- **WHEN** o usuário não possui orçamentos cadastrados para o mês
- **THEN** a interface SHALL exibir um estado informativo convidando o usuário a definir seu primeiro teto de gastos
