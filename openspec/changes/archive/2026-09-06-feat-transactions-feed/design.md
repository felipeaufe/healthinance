## Context

Com as contas bancárias integradas e exibidas no Dashboard, o próximo passo do Plano 1 (MVP) é fornecer visibilidade sobre o fluxo de caixa através do extrato de transações recentes e dos indicadores consolidados do mês (Receitas, Despesas e Balanço Líquido). O banco de dados já possui a tabela `pluggy_transactions` com suporte a chave primária `id`, `account_id`, `user_id`, `amount`, `date`, `category`, `type` e `status`.

## Goals / Non-Goals

**Goals:**
- Expor endpoint REST autenticado `GET /api/transactions` com suporte a paginação e filtro por `accountId`.
- Implementar helper Server Component no Next.js (`apps/web/src/lib/server/transactions.ts`) para consulta eficiente das transações do mês e cálculo dos indicadores.
- Renderizar cards de métricas do mês (Receitas do Mês, Despesas do Mês, Resultado Líquido) no topo do Dashboard.
- Substituir a mensagem estática de extrato por um feed dinâmico e responsivo com itens categorizados, data formatada e diferenciação visual de valores (verde para receitas, vermelho para despesas).

**Non-Goals:**
- Regras complexas de auto-categorização com regex e inteligência artificial (pertence ao Plano 2).
- Gestão e pagamento de faturas parceladas de cartão (Plano 2).
- Gráficos avançados de projeção futura (Plano 2).

## Decisions

### 1. Camada de Dados e Consulta Otimizada no Server Component
- **Decisão**: A página `apps/web/src/app/dashboard/page.tsx` continuará sendo um Server Component e consultará as transações recentes e métricas diretamente via Drizzle ORM através de helper no servidor.
- **Racional**: Elimina o overhead de requisições HTTP internas entre frontend e backend no mesmo servidor, diminuindo o consumo de CPU e mantendo latência inferior a 15ms.
- **Alternativa Considerada**: Fazer `fetch(http://localhost:3333/api/transactions)` dentro do Server Component. Rejeitado para evitar dependência de rede entre processos locais em tempo de renderização.

### 2. Contrato da API Fastify e Compatibilidade
- **Decisão**: Criar a rota `GET /api/transactions` em `apps/api/src/routes/finances.ts` validando o token JWT do Supabase e retornando a lista paginada e os dados do banco associado.
- **Racional**: Permite que clientes externos, PWAs no cliente ou testes automatizados consumam o extrato via API padronizada.

### 3. Normalização de Valores e Indicadores Mensais
- **Decisão**: Padronizar que transações do tipo `CREDIT` representam receitas/entradas e `DEBIT` representam despesas/saídas.
- **Cálculo Mensal**:
  - `monthlyIncome`: Soma de todos os créditos do mês corrente.
  - `monthlyExpenses`: Soma de todos os débitos do mês corrente.
  - `netBalance`: `monthlyIncome - monthlyExpenses`.
- **Racional**: Proporciona clareza imediata sobre se o usuário fechou o mês no azul ou no vermelho.

### 4. Limite de Transações e Paginação
- **Decisão**: Exibir no Dashboard inicial as 10 a 20 transações mais recentes ordenadas por `date DESC`.
- **Racional**: Evita carregamento excessivo de dados no DOM, garantindo velocidade no carregamento em conexões móveis.

## Risks / Trade-offs

- **[Contas recém-conectadas no Sandbox sem transações imediatas]** → Mitigation: Exibir empty state amigável e informativo na seção de extrato, orientando que as movimentações aparecerão assim que forem sincronizadas.
- **[Diferenças de fusos horários nas datas de transações]** → Mitigation: Tratar datas no padrão ISO 8601 e exibir data local no formato brasileiro (`dd/MM/yyyy`).
