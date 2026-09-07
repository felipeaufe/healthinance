## Context

Com a finalização do Plano 1 (contas e transações sincronizadas), o Healthinance inicia a Fase 2 (Controle Ativo e Previsibilidade). O objetivo é fornecer ao usuário ferramentas ativas para planejar seus gastos mensais através de tetos por categoria, acompanhando visualmente o ritmo de consumo para evitar surpresas financeiras no final do mês.

## Goals / Non-Goals

**Goals:**
- Criar a tabela `budgets` no PostgreSQL via Drizzle ORM.
- Prover rotas Fastify autenticadas para CRUD de orçamentos.
- Calcular em tempo real o valor consumido, a porcentagem gasta e o ritmo diário seguro ("Safe to Spend").
- Implementar componente visual de orçamentos no frontend com termômetro (barras de progresso coloridas) e modal de criação/ajuste.

**Non-Goals:**
- Envio de notificações push ou webhooks de alerta de estouro de gastos (fases posteriores).
- Motor de regras de auto-categorização com regex (change `feat-categorization-rules`).
- Projeções de fluxo de caixa futuro de 30/60/90 dias (change `feat-cashflow-projection`).

## Decisions

### 1. Modelagem da Tabela `budgets` no Drizzle ORM
- **Decisão**: Criar a tabela `budgets` com:
  - `id`: `uuid` chave primária com `defaultRandom()`.
  - `userId`: `uuid` com chave estrangeira para `users.id` com exclusão em cascata.
  - `category`: `varchar(128)` identificando a categoria (ex: "Alimentação", "Transporte", "Lazer", "Saúde", "Moradia", "Outros").
  - `amount`: `numeric(15, 2)` representando o teto estipulado.
  - `periodMonth`: `integer` (1 a 12).
  - `periodYear`: `integer` (ex: 2026).
  - `alertPercent`: `integer` default 80.
- **Racional**: Simples, leve e totalmente compatível com a estrutura de categorias retornadas pela Pluggy e pelo sistema.

### 2. Agregação em Tempo Real do Consumo
- **Decisão**: O valor consumido por categoria no mês será calculado consultando as transações de débito daquele mês e categoria na tabela `pluggy_transactions`.
- **Racional**: Garante consistência imediata sem risco de dados dessincronizados por cache ou contadores desatualizados.

### 3. Cálculo do Safe to Spend Diário
- **Decisão**:
  - `spent`: soma absoluta das despesas da categoria no mês.
  - `remaining`: `Math.max(0, amount - spent)`.
  - `daysRemaining`: total de dias no mês atual menos o dia de hoje + 1.
  - `safeToSpendDaily`: `remaining / daysRemaining`.
  - Níveis visuais:
    - 🟢 Normal: $le 70%$ consumido.
    - 🟡 Atenção: entre 1%$ e 0%$ consumido.
    - 🔴 Perigo / Estouro: $> 90%$ ou consumido $ge 100%$.

### 4. Integração Frontend
- **Decisão**: Helper Server Component `apps/web/src/lib/server/budgets.ts` para carregar orçamentos com consumo no Dashboard, com modal interativo para adicionar novo orçamento chamando `POST /api/budgets`.

## Risks / Trade-offs

- **[Categorias com grafia diferente entre bancos]** → Mitigation: Manter mapeamento padronizado de categorias principais e permitir busca exata por nome.
- **[Meses com 28, 30 ou 31 dias]** → Mitigation: Utilizar cálculo dinâmico de dias restantes com `new Date(year, month, 0).getDate()`.
