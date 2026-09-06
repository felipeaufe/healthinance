# Plano de Desenvolvimento 1: Básico (MVP / Core Financeiro)
**Projeto:** Healthinance  
**Fase:** 01 - Fundação e MVP  
**Status:** Planejado  
**Alinhamento OpenSpec:** Este documento serve como base para abertura dos changes `feat-pluggy-accounts-sync`, `feat-manual-accounts`, `feat-transactions-crud` e `feat-dashboard-metrics`.

---

## 1. Visão Geral e Objetivos do MVP

O objetivo deste primeiro plano é entregar um **Produto Mínimo Viável (MVP)** funcional, seguro e alinhado à stack do Healthinance (Next.js, Fastify, Supabase e Drizzle ORM). O usuário deve ser capaz de centralizar suas contas bancárias via Open Finance (utilizando a **Pluggy API**), cadastrar contas manuais (carteiras físicas ou bancos não suportados), sincronizar transações e realizar a categorização básica de suas receitas e despesas.

### Metas Principais
1. Autenticar com a Pluggy API e implementar o fluxo seguro do *Connect Widget* via backend Fastify.
2. Persistir e consolidar contas (`CHECKING`, `SAVINGS`, `MANUAL`) utilizando **Drizzle ORM** sobre PostgreSQL/Supabase.
3. Sincronizar e categorizar extratos bancários automaticamente (via webhooks e sync sob demanda) e permitir lançamentos manuais.
4. Disponibilizar um Dashboard no Next.js (`apps/web`) com métricas essenciais (saldo consolidado, despesas por categoria e fluxo de receitas vs. despesas).

---

## 2. Escopo Funcional Detalhado

### 2.1. Dashboard Principal (`apps/web`)
* **Saldo Consolidado:** Somatório do saldo disponível em todas as contas ativas do usuário autenticado no Supabase.
* **Cards de Contas:** Lista com saldo individual por instituição/banco (ex: Nubank, Itaú, Carteira Manual).
* **Últimas Transações:** Feed com as últimas transações realizadas, destacando valor, data, conta de origem e categoria.
* **Indicadores do Mês:** Total de receitas do mês atual, total de despesas do mês atual e resultado líquido (`Receitas - Despesas`).

### 2.2. Gestão de Contas e Instituições
* **Contas Automáticas (Pluggy):**
  * Conexão via Pluggy Connect (bancos tradicionais e fintechs).
  * Exibição de status da conexão (`UPDATING`, `UPDATED`, `LOGIN_ERROR`, `WAITING_USER_INPUT`).
  * Atualização de saldo sob demanda e via webhook do Fastify.
* **Contas Manuais:**
  * Criação, edição e exclusão de contas manuais (ex: "Carteira Dinheiro Vivo", "Poupança Cofrinho").
  * Definição de saldo inicial e ajuste manual de saldo.

### 2.3. Gestão de Transações
* **Importação Automática:** Transações capturadas via Pluggy API persistidas na tabela `pluggy_transactions`.
* **Lançamentos Manuais:**
  * Nova Receita (Data, Valor, Conta, Categoria, Descrição).
  * Nova Despesa (Data, Valor, Conta, Categoria, Descrição).
  * Transferência entre Contas (Origem, Destino, Valor, Data).
* **Edição de Transações:** Alteração da categoria e descrição de transações importadas.
* **Filtros e Busca:** Filtrar transações por período (mês/ano), conta e categoria.

### 2.4. Categorização Básica
* **Categorias Padrão:** Pré-cadastradas no sistema (Alimentação, Moradia, Transporte, Saúde, Lazer, Salário, Investimentos, Outros).
* **Mapeamento Inicial:** Conversão automática das categorias nativas da Pluggy para as categorias internas da aplicação.
* **Personalização:** Possibilidade de o usuário cadastrar novas categorias com nome, cor e ícone.

### 2.5. Relatórios Essenciais
* **Gráfico de Despesas por Categoria:** Gráfico em formato de rosca/pizza (`recharts`) com detalhamento percentual.
* **Balanço Mensal:** Gráfico de barras simples comparando receitas vs. despesas ao longo dos últimos meses.

---

## 3. Especificação Técnica da Integração Pluggy API

```
+----------------+              +-----------------+             +------------------+
|   apps/web     |              |    apps/api     |             |    Pluggy API    |
| (Next.js PWA)  |              |    (Fastify)    |             |                  |
+-------+--------+              +--------+--------+             +--------+---------+
        |                                |                               |
        | 1. POST /api/pluggy/connect-token                              |
        |    (Bearer Supabase JWT)       |                               |
        +------------------------------->|                               |
        |                                | 2. POST /auth (com cache)     |
        |                                +------------------------------>|
        |                                |    Retorna apiKey             |
        |                                |<------------------------------+
        |                                | 3. POST /connect_token        |
        |                                +------------------------------>|
        |                                |    Retorna connectToken       |
        |                                |<------------------------------+
        | 4. Retorna { connectToken }    |                               |
        |<-------------------------------+                               |
        |                                                                |
        | 5. Abre @pluggy/react-connect Widget (Login Seguro no Banco)   |
        +--------------------------------------------------------------->|
        | 6. Sucesso! Retorna itemId no onSuccess callback               |
        |<---------------------------------------------------------------+
        |                                                                |
        | 7. POST /api/pluggy/items/:id/sync                             |
        +------------------------------->| 8. GET /accounts?itemId=...   |
        |                                +------------------------------>|
        |                                | 9. GET /transactions?...      |
        |                                +------------------------------>|
        |                                | 10. Salva via Drizzle ORM     |
        | 11. 200 OK (Sincronizado)      |                               |
        |<-------------------------------+                               |
```

### Endpoints do Backend Fastify (`apps/api`)
1. `POST /api/pluggy/connect-token`
   * Protegido por Supabase JWT.
   * Gera o token efêmero para o widget via Pluggy SDK.
2. `POST /api/webhooks/pluggy`
   * Endpoint público (validação por hash/assinatura se configurado).
   * Escuta evento `item/updated` e `transactions/created` respondendo `200 OK` imediatamente e processando a sincronização em background.
3. `POST /api/pluggy/items/:id/sync`
   * Disparo manual de sincronização de contas e transações recentes.
4. `GET /api/accounts` e `POST /api/accounts`
   * Listagem de contas unificadas (Pluggy + Manuais) e criação de conta manual.
5. `GET /api/transactions` e `POST /api/transactions`
   * Extrato paginado com filtros e criação de transação manual.

---

## 4. Modelo de Dados (Drizzle ORM em `packages/database`)

O Healthinance utiliza **Drizzle ORM** com tabelas no PostgreSQL do Supabase. A estrutura de dados para o MVP estende o schema atual:

```typescript
// packages/database/src/schema/finances.ts
import { pgTable, varchar, uuid, text, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { pluggyAccounts, pluggyTransactions } from './pluggy.js';

// Contas Manuais do Usuário
export const manualAccounts = pgTable('manual_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(), // 'CASH', 'SAVINGS', 'OTHER'
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  currencyCode: varchar('currency_code', { length: 8 }).notNull().default('BRL'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categorias do Sistema e do Usuário
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = categoria padrão
  name: varchar('name', { length: 128 }).notNull(),
  color: varchar('color', { length: 32 }), // '#10B981'
  icon: varchar('icon', { length: 64 }),   // 'shopping-bag'
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transações Manuais do Usuário
export const manualTransactions = pgTable('manual_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .references(() => manualAccounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // Positivo = Receita, Negativo = Despesa
  date: timestamp('date', { withTimezone: true }).notNull(),
  type: varchar('type', { length: 32 }).notNull(), // 'DEBIT', 'CREDIT'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 5. Decomposição em Changes OpenSpec

| Change OpenSpec | Escopo Principal | Testes Obrigatórios |
| :--- | :--- | :--- |
| `feat-pluggy-accounts-sync` | Endpoints Fastify para gerar connectToken, sincronizar contas e webhooks | Vitest (mock Pluggy SDK, validação Drizzle) |
| `feat-manual-accounts` | Schemas Drizzle e rotas para criação e ajuste de contas manuais | Vitest (CRUD contas) + Playwright (modal de nova conta) |
| `feat-transactions-crud` | Unificação de extrato (Pluggy + Manual) e formulário de novo lançamento | Vitest (regras de cálculo) + Playwright (fluxo de lançamento) |
| `feat-dashboard-metrics` | Telas do Dashboard Next.js com cards e gráficos Recharts | Playwright (renderização desktop/mobile PWA) |
