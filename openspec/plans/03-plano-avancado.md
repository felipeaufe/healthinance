# Plano de Desenvolvimento 3: Avançado (Inteligência Artificial, Investimentos e Alta Gestão)
**Projeto:** Healthinance  
**Fase:** 03 - Inteligência Patrimonial e Análise Preditiva  
**Status:** Planejado (Depende das Fases 01 e 02)  
**Alinhamento OpenSpec:** Este documento serve como base para abertura dos changes `feat-ai-financial-assistant`, `feat-ghost-subscriptions-detector`, `feat-pluggy-investments-networth`, `feat-financial-health-score` e `feat-scenario-simulator`.

---

## 1. Visão Geral e Objetivos

O plano avançado eleva o Healthinance para a categoria de **consultor financeiro inteligente e consolidador patrimonial 360°**. Nesta fase, a aplicação agrega dados bancários e investimentos via Pluggy API, processa essas informações através de **Inteligência Artificial (LLMs com RAG e chamadas de função seguras)** para responder dúvidas em linguagem natural, audita cobranças ocultas e simula cenários de longo prazo (aposentadoria, grandes aquisições e independência financeira).

### Metas Principais
1. Implementar um Assistente Conversacional com IA integrado à base do usuário com sanitização prévia de PII.
2. Desenvolver o detector algorítmico de assinaturas e recorrências ("Cobranças Fantasmas") com avisos de aumentos de preço.
3. Consolidar a carteira de investimentos via Pluggy API (`GET /investments`) e calcular o Patrimônio Líquido (*Net Worth*) em tempo real.
4. Construir o Simulador de Cenários Financeiros ("E se...?") com impacto em projeções futuras.
5. Implementar diagnóstico de *Health Score* baseado na regra 50-30-20.
6. Gerar relatórios anuais consolidados de apoio ao Imposto de Renda (IRPF).

---

## 2. Escopo Funcional Detalhado

### 2.1. Assistente Pessoal com IA (Chatbot Analítico)
* **Interface Conversacional em `apps/web`:** Janela de chat responsiva (estilo copilot) acessível em desktop e PWA.
* **Consultas em Linguagem Natural:**
  * *"Quanto sobrou de dinheiro líquido no mês passado descontando as faturas de cartão?"*
  * *"Qual categoria teve o maior crescimento de gastos comparado ao trimestre anterior?"*
  * *"Se eu cortar R$ 250 de restaurantes todo mês, quando atinjo minha reserva de emergência?"*
* **Relatório Executivo Mensal por IA:** No dia 1º de cada mês, um background worker do Fastify consolida os dados e gera um resumo executivo:
  1. Balanço geral e taxa de poupança atingida.
  2. Detecção de anomalias (gastos atípicos).
  3. Recomendações práticas e oportunidades reais de corte identificadas.

### 2.2. Detector de Assinaturas e Recorrências Ocultas ("Cobranças Fantasmas")
* **Algoritmo de Detecção Periódica:** Rastreamento de débitos recorrentes de mesmo valor ou padrão (Netflix, Spotify, academias, softwares SaaS, assinaturas de clubes).
* **Alerta de Reajuste Indevido:** Notificação imediata se uma assinatura sofrer aumento de preço em relação à média histórica.
* **Painel de Custo Anualizado:** Projeção do custo somado de todas as micro-assinaturas em 12 meses.

### 2.3. Consolidação de Investimentos e Patrimônio Líquido (Net Worth)
* **Sincronização via Pluggy API:** Consumo de `GET /investments?itemId={itemId}`.
* **Classes de Ativos Mapeadas:**
  * Renda Fixa (Tesouro Direto, CDBs, LCIs, LCAs).
  * Renda Variável (Ações B3, FIIs, ETFs).
  * Fundos de Investimento e Criptoativos.
* **Cálculo de Patrimônio Líquido:**
  $$\text{Net Worth} = (\text{Saldos em Conta} + \text{Investimentos}) - (\text{Faturas Abertas} + \text{Dívidas})$$
* **Gráficos de Alocação de Ativos:** Visão percentual por classe de ativo vs. perfil de risco do usuário.

### 2.4. Simulador de Cenários Financeiros ("E se...?")
* **Simulação de Decisões de Vida:**
  * Compra de imóvel ou veículo financiado vs. poupar e comprar à vista.
  * Transição de carreira ou ano sabático (cálculo de meses de reserva necessários).
* **Calculadora de Independência Financeira (FIRE):**
  * Projeção de juros compostos com base na taxa média de poupança do usuário.
  * Cálculo de renda passiva estimada com base na Regra dos 4%.

### 2.5. Health Score Financeiro e Regra 50-30-20
* **Classificação Automática das Despesas:**
  * **50% - Necessidades:** Moradia, contas básicas, supermercado, saúde e transporte essencial.
  * **30% - Desejos:** Bares, restaurantes, compras, streaming e lazer.
  * **20% - Poupança e Dívidas:** Aportes, quitação e reserva de emergência.
* **Pontuação de Saúde (0 a 100):** Avaliação ponderada entre taxa de poupança, índice de endividamento e cobertura de reserva.

### 2.6. Apoio ao Imposto de Renda (IRPF)
* **Relatório de Posição em 31/12:** Agrupamento de saldos bancários e investimentos para a declaração de "Bens e Direitos".
* **Extrato Consolidado de Rendimentos:** Informes tributáveis e isentos importados da Pluggy.

---

## 3. Especificação Técnica da Integração Pluggy API

```
+------------------------------------+
|             Pluggy API             |
+---+--------------------+-------+---+
    |                    |       |
    | 1. GET /investments|       | 2. GET /accounts (type=CREDIT)
    v                    |       v
+---+--------------------+-------+---+
|         Fastify Backend            |
|       (apps/api + Drizzle)         |
+-----------------+------------------+
                  |
                  | 3. Middleware de Anonimização (Remove PII / CPF / Contas)
                  v
+-----------------+------------------+
|      Pipeline de IA (Fastify)      |
|    (LLM Provider - Function Call)  |
+-----------------+------------------+
                  |
                  | 4. Resposta Estruturada / Insights JSON
                  v
+-----------------+------------------+
|   apps/web (Dashboard Next.js)     |
+------------------------------------+
```

### Endpoints da Pluggy Utilizados
1. `GET https://api.pluggy.ai/investments?itemId={itemId}`
   * Coleta ativos com `name`, `code`, `balance`, `type`, `rate` e `dueDate`.
2. **Renovação de Consentimento do Open Finance:**
   * Acompanhamento do prazo de validade de 12 meses.
   * Disparo de fluxo amigável de renovação no widget em modo `update`.

### Pipeline de Anonimização e Segurança
* O Fastify executa um serviço sanitizador antes de qualquer chamada ao LLM:
  * Remove dados pessoais de identificação (PII: nomes, CPFs, e-mails, números de contas).
  * Encaminha estritamente dados estatísticos anonimizados: `[Data, Valor, Categoria, Tipo]`.

---

## 4. Evolução do Modelo de Dados (Drizzle ORM em `packages/database`)

```typescript
// packages/database/src/schema/investments_and_ai.ts
import { pgTable, varchar, uuid, text, integer, timestamp, numeric } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { pluggyItems } from './pluggy.js';

// Investimentos Sincronizados via Pluggy
export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pluggyItemId: varchar('pluggy_item_id', { length: 128 })
    .references(() => pluggyItems.id, { onDelete: 'set null' }),
  pluggyInvId: varchar('pluggy_inv_id', { length: 128 }).unique(), // investmentId da Pluggy
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 64 }), // Ticker: "PETR4", "Tesouro Selic"
  type: varchar('type', { length: 64 }).notNull(), // 'FIXED_INCOME', 'EQUITY', 'MUTUAL_FUND', 'CRYPTO'
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 4 }),
  rateType: varchar('rate_type', { length: 32 }), // 'CDI', 'IPCA', 'PRE'
  rateValue: numeric('rate_value', { precision: 6, scale: 2 }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Assinaturas e Recorrências Detectadas
export const detectedSubscriptions = pgTable('detected_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  serviceName: varchar('service_name', { length: 255 }).notNull(), // "Netflix", "Spotify"
  lastAmount: numeric('last_amount', { precision: 15, scale: 2 }).notNull(),
  billingDay: integer('billing_day').notNull(),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'), // 'ACTIVE', 'PRICE_INCREASED'
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
});

// Score de Saúde Financeira
export const financialHealthScores = pgTable('financial_health_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  overallScore: integer('overall_score').notNull(), // 0 a 100
  needsPercent: numeric('needs_percent', { precision: 5, scale: 2 }).notNull(),
  wantsPercent: numeric('wants_percent', { precision: 5, scale: 2 }).notNull(),
  savingsPercent: numeric('savings_percent', { precision: 5, scale: 2 }).notNull(),
  runwayMonths: numeric('runway_months', { precision: 5, scale: 1 }).notNull(),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 5. Decomposição em Changes OpenSpec

| Change OpenSpec | Escopo Principal | Testes Obrigatórios |
| :--- | :--- | :--- |
| `feat-ai-financial-assistant` | Rota Fastify `/api/ai/query` com sanitização PII e prompt analítico | Vitest (sanitização de dados) + Playwright (interface de chat) |
| `feat-ghost-subscriptions-detector` | Worker de detecção de periodicidade e alertas de reajuste | Vitest (casos de recorrências de valores e tolerância) |
| `feat-pluggy-investments-networth` | Sincronização de `GET /investments` e cálculo de Patrimônio Líquido | Vitest (agregação de ativos menos faturas) |
| `feat-financial-health-score` | Enquadramento 50-30-20 e cálculo do Health Score (0-100) | Vitest (fórmula do score) + Playwright (gauge chart) |
| `feat-scenario-simulator` | Calculadora de simulações financeiras e juros compostos | Vitest (precisão matemática e projeções) |
