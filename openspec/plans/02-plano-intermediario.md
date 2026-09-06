# Plano de Desenvolvimento 2: Intermediário (Projetar, Limitar e Otimizar Gastos)
**Projeto:** Healthinance  
**Fase:** 02 - Controle Ativo e Previsibilidade  
**Status:** Planejado (Depende da Fase 01)  
**Alinhamento OpenSpec:** Este documento serve como base para abertura dos changes `feat-budgets-and-limits`, `feat-cashflow-projection`, `feat-credit-cards-invoices`, `feat-categorization-rules`, `feat-transaction-deduplication` e `feat-savings-goals`.

---

## 1. Visão Geral e Objetivos

O plano intermediário transforma o Healthinance de um "extrato retroativo" em uma **ferramenta ativa de inteligência orçamentária e prevenção de desperdícios**. O foco desta fase é dar ao usuário o controle antecipado sobre suas finanças, impondo limites de gastos antes do estouro orçamentário, projetando saldos futuros com base em contas fixas e faturas de cartão, e automatizando a categorização e conciliação para eliminar atritos operacionais.

### Metas Principais
1. Implementar tetos orçamentários mensais por categoria com avisos preventivos.
2. Criar o motor de projeção de fluxo de caixa diário para 30, 60 e 90 dias.
3. Habilitar a gestão profunda de faturas de cartão de crédito e compras parceladas via Pluggy API.
4. Desenvolver motor de regras de auto-categorização (baseado em termos e padrões de estabelecimentos).
5. Implementar algoritmo de deduplicação e conciliação entre transações manuais e automáticas.
6. Criar módulo de Metas de Economia (Cofrinhos / Objetivos com cálculo de aportes sugeridos).

---

## 2. Escopo Funcional Detalhado

### 2.1. Orçamentos Mensais (Tetos de Gastos)
* **Definição de Limites:** Limite mensal por categoria (ex: Alimentação: R$ 1.200/mês, Lazer: R$ 400/mês).
* **Barra de Termômetro Visual:** Exibição da porcentagem consumida no frontend (`apps/web`):
  * Verde: até 70% consumido.
  * Amarelo: entre 71% e 90% consumido (alerta preventivo).
  * Vermelho: acima de 90% ou estouro de orçamento.
* **Ritmo Diário de Gasto ("Safe to Spend"):** Cálculo automático de quanto ainda é possível gastar por dia na categoria até o fechamento do mês sem ultrapassar o teto.

### 2.2. Projeção de Fluxo de Caixa Futuro (30 / 60 / 90 dias)
* **Lançamentos Recorrentes:** Cadastro de receitas e despesas fixas (salário, aluguel, condomínio, assinaturas).
* **Visão em Linha do Tempo:** Exibição do saldo estimado dia a dia.
* **Alerta de Saldo Negativo:** Detecção antecipada de datas em que o saldo projetado ficará negativo, alertando o usuário para remanejar fundos.

### 2.3. Gestão Avançada de Cartões de Crédito
* **Mapeamento de Contas `CREDIT` na Pluggy:** Leitura do payload `creditData`:
  * Fatura Aberta (gastos do ciclo atual).
  * Fatura Fechada (aguardando vencimento).
  * Faturas Futuras (projeção das compras parceladas nos meses seguintes).
* **Melhor Dia de Compra:** Cálculo dinâmico do dia posterior ao fechamento da fatura.
* **Pagamento de Fatura:** Conciliação inteligente do débito em conta corrente como quitação da fatura, sem duplicar a despesa.

### 2.4. Motor de Regras de Auto-Categorização
* **Regras Customizáveis:**
  * Critério: "Se a descrição contiver `IFOOD` ou `RAPPI`" $\rightarrow$ Categoria: `Alimentação > Delivery`.
  * Critério: "Se a descrição contiver `POSTO` ou `IPIRANGA`" $\rightarrow$ Categoria: `Transporte > Combustível`.
* **Aplicação Retroativa:** Possibilidade de rodar a regra sobre todas as transações passadas do usuário.
* **Sobrescrita Inteligente:** Regras criadas pelo usuário têm precedência sobre a categorização genérica da Pluggy.

### 2.5. Conciliação e Deduplicação Inteligente
* **Matching Automático:**
  * Se o usuário lançou manualmente uma despesa de R$ 65,00 no dia 12 e a Pluggy sincronizou um lançamento de R$ 65,00 no dia 12 ou 13 na mesma conta, o sistema detecta a duplicidade e sugere a mesclagem.
* **Identificação de Transferências Internas:**
  * Identificação de pares de transações com mesmo valor em contas diferentes (ex: Pix enviado da Conta A para a Conta B), consolidando-as como transferência neutra.

### 2.6. Tags Transversais e Anexo de Comprovantes
* **Tags (Marcadores):** Agrupamento para eventos pontuais (ex: `#Férias2026`, `#ReformaCozinha`).
* **Upload de Documentos:** Armazenamento seguro de fotos de recibos e notas fiscais em PDF (usando Supabase Storage) vinculados à transação.

### 2.7. Metas de Economia (Cofrinhos)
* **Criação de Metas:** Nome, valor alvo, prazo final e saldo acumulado.
* **Aporte Mensal Sugerido:** `(Valor Alvo - Saldo Atual) / Meses Restantes`.
* **Barra de Progresso:** Acompanhamento do percentual atingido rumo ao objetivo.

---

## 3. Especificação Técnica da Integração Pluggy API

```
+----------------+                   +------------------+                   +--------------------+
|   Pluggy API   |                   | apps/api Fastify |                   | PostgreSQL/Supabase|
+-------+--------+                   +--------+---------+                   +---------+----------+
        |                                     |                                       |
        | 1. Webhook: transactions/created    |                                       |
        +------------------------------------>|                                       |
        |                                     | 2. Executa Deduplicação (Drizzle)     |
        |                                     +-------------------------------------->|
        |                                     |    (Checa se já existe manual)        |
        |                                     | 3. Aplica Regras de Categorização     |
        |                                     +-------------------------------------->|
        |                                     | 4. Atualiza Consumo de Orçamentos     |
        |                                     +-------------------------------------->|
        |                                     | 5. Se > 90%, emite alerta             |
        |                                     |                                       |
        | 6. Webhook: item/waiting_user_input |                                       |
        +------------------------------------>|                                       |
        |                                     | 7. Sinaliza status da conta no banco  |
        |                                     +-------------------------------------->|
```

---

## 4. Evolução do Modelo de Dados (Drizzle ORM em `packages/database`)

```typescript
// packages/database/src/schema/budgets_and_rules.ts
import { pgTable, varchar, uuid, integer, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { categories } from './finances.js';

// Orçamentos Mensais por Categoria
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Teto orçamentário
  periodMonth: integer('period_month').notNull(), // 1 a 12
  periodYear: integer('period_year').notNull(),   // 2026
  alertPercent: integer('alert_percent').notNull().default(80),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Regras de Auto-Categorização
export const categorizationRules = pgTable('categorization_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  keyword: varchar('keyword', { length: 255 }).notNull(), // "IFOOD"
  matchType: varchar('match_type', { length: 32 }).notNull().default('CONTAINS'), // 'CONTAINS', 'EXACT'
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  priority: integer('priority').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
});

// Metas Financeiras (Cofrinhos)
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  targetAmount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  targetDate: timestamp('target_date', { withTimezone: true }),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Lançamentos Recorrentes (Fluxo de Caixa)
export const recurringBills = pgTable('recurring_bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(), // 'DEBIT', 'CREDIT'
  frequency: varchar('frequency', { length: 32 }).notNull().default('MONTHLY'),
  dueDay: integer('due_day').notNull(), // Dia do mês (1 a 31)
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
});
```

---

## 5. Decomposição em Changes OpenSpec

| Change OpenSpec | Escopo Principal | Testes Obrigatórios |
| :--- | :--- | :--- |
| `feat-budgets-and-limits` | CRUD de orçamentos e cálculo de termômetro no backend Fastify | Vitest (cálculo de consumo e safe-to-spend) + Playwright (barra visual) |
| `feat-cashflow-projection` | Lançamentos recorrentes e projeção diária a 30/60/90 dias | Vitest (algoritmo de projeção e alertas de saldo negativo) |
| `feat-credit-cards-invoices` | Extração de `creditData` da Pluggy, visualização de faturas abertas e futuras | Vitest (parse de faturas e limite disponível) |
| `feat-categorization-rules` | Motor de regras e aplicação em lote sobre transações | Vitest (matching de regex/substring) |
| `feat-transaction-deduplication` | Algoritmo de matching de data/valor para mesclagem de lançamentos | Vitest (casos de borda de tolerância temporal e valores) |
| `feat-savings-goals` | Criação de metas e cálculo de esforço mensal sugerido | Vitest (cálculo de aporte) + Playwright (UI de metas) |
