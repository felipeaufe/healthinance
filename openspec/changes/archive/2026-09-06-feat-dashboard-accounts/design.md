## Context

Atualmente, o banco de dados PostgreSQL do Supabase já possui as tabelas `pluggy_items` e `pluggy_accounts` povoadas após a sincronização do Pluggy Connect Widget. No entanto, o frontend em `apps/web/src/app/dashboard/page.tsx` renderiza apenas elementos estáticos com "R$ 0,00" e "0 bancos".

## Goals / Non-Goals

**Goals:**
- Disponibilizar endpoint autenticado `GET /api/accounts` no Fastify para retornar contas e instituições vinculadas ao usuário autenticado (`sub` do JWT).
- No Server Component `apps/web/src/app/dashboard/page.tsx`, buscar as contas e itens do usuário autenticado via Drizzle ORM para renderização imediata com zero latência de rede adicional no servidor.
- Exibir dinamicamente o Saldo Total Consolidado formatado em BRL, o número de bancos conectados e a listagem de cards de contas bancárias.
- Exibir estado de fallback amigável quando o usuário ainda não conectou nenhum banco.

**Non-Goals:**
- Edição de contas manuais (escopo do change `feat-manual-accounts`).
- CRUD e categorização de transações manuais (escopo do change `feat-transactions-crud`).
- Gráficos avançados de despesas por categoria com Recharts (próxima etapa do MVP).

## Decisions

### 1. Duplo Acesso: Endpoint Fastify (`GET /api/accounts`) e SSR no Next.js
- **Decisão**: Implementar a rota `GET /api/accounts` no Fastify para consumo por clientes REST/mobile e, simultaneamente, realizar a leitura direta pelo Server Component do Next.js via `@healthinance/database` (`createDbClient`).
- **Justificativa**: Em Server Components do Next.js dentro de um monorepo TypeScript, ler diretamente do banco via Drizzle ORM reduz roundtrips HTTP, previne cold-starts de microsserviços e elimina a necessidade de repassar cookies/headers internos, mantendo o endpoint do Fastify disponível para clientes externos e testes de API.
- **Alternativa Considerada**: Fazer `fetch('http://localhost:3333/api/accounts')` dentro do Server Component. Rejeitada por adicionar latência desnecessária e depender do processo da API estar online durante builds/SSG.

### 2. Formatação Monetária e Cálculo do Saldo Consolidado
- **Decisão**: Utilizar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para apresentação consistente de valores monetários.
- **Cálculo**: O saldo consolidado soma os saldos de contas do tipo `BANK` e reflete os débitos/créditos de forma transparente.

## Risks / Trade-offs

- **[Conexões PostgreSQL simultâneas no Server Component]** → O helper `createDbClient()` reutiliza a pool de conexão via `postgres` driver sem estourar os limites do Supabase pooler (porta 5432 / porta 6543).
- **[Atualização após conexão no Widget]** → O callback `onSuccess` do `PluggyConnectButton` já executa `router.refresh()` após o `sync`, garantindo que o Server Component do Next.js re-renderize os novos dados imediatamente após o fechamento do modal da Pluggy.
