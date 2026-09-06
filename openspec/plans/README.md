# Planos de Implementação e Roteiro de Mudanças (OpenSpec)

Este diretório contém os **Planos Estratégicos de Implementação** do **Healthinance**, projetados para guiar o ciclo de desenvolvimento orientado a especificações (**OpenSpec**).

---

## Como estes Planos se Conectam ao OpenSpec

De acordo com as diretrizes do [AGENTS.md](../../AGENTS.md), **nenhuma funcionalidade é codificada de forma ad-hoc sem um change OpenSpec correspondente**.

Os documentos neste diretório atuam como **Documentos de Visão e Requisitos de Nível Épico**. Eles não substituem os changes do OpenSpec; em vez disso, **cada fase ou módulo de um plano se decompõe em um ou mais changes granulares do OpenSpec**:

```
[Plano Estratégico em openspec/plans/]
                 │
                 ▼  (Decomposição em features atômicas)
    openspec new change <nome-da-mudanca>
                 │
                 ├── proposal.md       (Porquê, O que muda, Impacto)
                 ├── specs/<cap>/spec.md (Requisitos e Cenários WHEN/THEN)
                 ├── design.md         (Decisões com Drizzle ORM / Fastify)
                 └── tasks.md          (Checklist sequencial de implementação e testes)
                 │
                 ▼  (Implementação + Testes Vitest/Playwright)
    openspec archive <nome-da-mudanca>  --> specs consolidadas em openspec/specs/
```

---

## Estrutura dos Planos

1. **[01-plano-basico.md](./01-plano-basico.md) — Fase 1: Fundação e MVP**
   * *Objetivo:* Extrato consolidado, contas manuais/automáticas, transações, categorização e dashboard inicial.
   * *Changes OpenSpec Previstos:*
     * `feat-pluggy-accounts-sync`
     * `feat-manual-accounts`
     * `feat-transactions-crud`
     * `feat-dashboard-metrics`
2. **[02-plano-intermediario.md](./02-plano-intermediario.md) — Fase 2: Controle Ativo e Otimização**
   * *Objetivo:* Tetos orçamentários, projeção de fluxo de caixa (30/60/90 dias), cartões de crédito detalhados, regras de auto-categorização, deduplicação e metas financeiras.
   * *Changes OpenSpec Previstos:*
     * `feat-budgets-and-limits`
     * `feat-cashflow-projection`
     * `feat-credit-cards-invoices`
     * `feat-categorization-rules`
     * `feat-transaction-deduplication`
     * `feat-savings-goals`
3. **[03-plano-avancado.md](./03-plano-avancado.md) — Fase 3: Inteligência e Gestão Patrimonial**
   * *Objetivo:* Assistente com IA (RAG/NLP), detector de assinaturas fantasmas, investimentos via Pluggy, simulador de cenários ("E se...?"), Health Score 50-30-20 e anonimização de dados.
   * *Changes OpenSpec Previstos:*
     * `feat-ai-financial-assistant`
     * `feat-ghost-subscriptions-detector`
     * `feat-pluggy-investments-networth`
     * `feat-financial-health-score`
     * `feat-scenario-simulator`

---

## Conformidade Arquitetural do Healthinance

Ao criar changes derivados destes planos, as seguintes restrições técnicas devem ser rigorosamente aplicadas:
* **Backend:** Fastify com TypeScript em `apps/api` (consumo $\le 512$MB RAM).
* **Frontend:** Next.js App Router com Tailwind CSS e shadcn/ui em `apps/web`.
* **Banco de Dados:** Drizzle ORM em `packages/database` sobre PostgreSQL/Supabase (**Prisma é estritamente proibido**).
* **Contratos:** DTOs e Schemas Zod compartilhados em `packages/types`.
* **Testes Obrigatórios:**
  * Testes unitários/integração com **Vitest** cobrindo serviços e schemas.
  * Testes E2E com **Playwright** cobrindo fluxos visuais observáveis.
