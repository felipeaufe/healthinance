import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getUserAccounts } from '../../lib/server/accounts';
import { getUserTransactions } from '../../lib/server/transactions';
import { getUserBudgets } from '../../lib/server/budgets';
import { UserNav } from '../../components/UserNav';
import { PluggyConnectButton } from '../../components/PluggyConnectButton';
import { BudgetsSection } from '../../components/BudgetsSection';
import {
  Landmark,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Activity,
  CreditCard,
  Building2,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userName = user.user_metadata?.name || null;
  const userEmail = user.email || 'Usuário';

  const { accounts, totalBalance, institutionsCount } = await getUserAccounts(user.id);
  const { transactions, summary } = await getUserTransactions(user.id, 20);
  const { budgets, totalBudgeted, totalSpent } = await getUserBudgets(user.id);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getAccountTypeLabel = (type: string, subtype?: string | null) => {
    if (type === 'CREDIT' || subtype === 'CREDIT_CARD') return 'Cartão de Crédito';
    if (subtype === 'SAVINGS_ACCOUNT') return 'Conta Poupança';
    if (type === 'BANK' || subtype === 'CHECKING_ACCOUNT') return 'Conta Corrente';
    if (type === 'INVESTMENT') return 'Investimentos';
    return type;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-green-600/20">
              H
            </div>
            <span className="text-xl font-bold tracking-tight">Healthinance</span>
          </div>

          <UserNav email={userEmail} name={userName} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Welcome Banner */}
        <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sessão Autenticada
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Olá, {userName || userEmail.split('@')[0]}!
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Gerencie seus dados de Open Finance, conecte novas contas e acompanhe sua saúde financeira em tempo real.
            </p>
          </div>

          <div className="shrink-0">
            <PluggyConnectButton />
          </div>
        </section>

        {/* Financial Snapshot Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Saldo Total Disponível</span>
              <Wallet className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {accounts.length === 0
                ? 'Nenhuma conta bancária sincronizada'
                : accounts.length === 1
                ? '1 conta conectada'
                : `${accounts.length} contas conectadas`}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Instituições Conectadas</span>
              <Landmark className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {institutionsCount === 1 ? '1 banco' : `${institutionsCount} bancos`}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {institutionsCount > 0 ? 'Conectado via Pluggy Open Finance' : 'Conecte via Pluggy Open Finance'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Índice de Saúde Financeira</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-emerald-500">
              {accounts.length > 0 ? '85 / 100' : '-- / 100'}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {accounts.length > 0 ? 'Fluxo de caixa saudável' : 'Aguardando dados de fluxo de caixa'}
            </span>
          </div>
        </section>

        {/* Indicadores do Mês */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="monthly-summary-section">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Receitas do Mês</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold mt-2 text-emerald-600 dark:text-emerald-400" data-testid="monthly-income">
              {formatCurrency(summary.monthlyIncome)}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {summary.transactionsCount > 0 ? 'Entradas registradas' : 'Sem receitas no mês'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Despesas do Mês</span>
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl font-bold mt-2 text-red-600 dark:text-red-400" data-testid="monthly-expenses">
              {formatCurrency(summary.monthlyExpenses)}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {summary.transactionsCount > 0 ? 'Saídas e pagamentos' : 'Sem despesas no mês'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Resultado Líquido</span>
              <TrendingUp className={`w-4 h-4 ${summary.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <p
              className={`text-xl font-bold mt-2 ${
                summary.netBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
              data-testid="monthly-net-balance"
            >
              {formatCurrency(summary.netBalance)}
            </p>
            <span className="text-xs text-slate-400 mt-1 inline-block">
              {summary.netBalance >= 0 ? 'Superávit no período' : 'Déficit no período'}
            </span>
          </div>
        </section>

        {/* Orçamentos & Limites de Gastos (Safe to Spend) */}
        <BudgetsSection
          initialBudgets={budgets}
          totalBudgeted={totalBudgeted}
          totalSpent={totalSpent}
        />

        {/* Minhas Contas Bancárias */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold tracking-tight">Minhas Contas Bancárias</h2>
            </div>
            {accounts.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {accounts.length} {accounts.length === 1 ? 'conta ativa' : 'contas ativas'}
              </span>
            )}
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="accounts-grid">
              {accounts.map((acc) => {
                const isCredit = acc.type === 'CREDIT';
                return (
                  <div
                    key={acc.id}
                    data-testid={`account-card-${acc.id}`}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                            {isCredit ? <CreditCard className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-500 block">
                              {acc.connectorName || 'Open Finance'}
                            </span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Ativa
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {acc.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {getAccountTypeLabel(acc.type, acc.subtype)}
                        {acc.number ? ` •••• ${acc.number.slice(-4)}` : ''}
                      </p>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {isCredit ? 'Fatura Atual' : 'Saldo'}
                      </span>
                      <span
                        className={`text-lg font-extrabold ${
                          isCredit && acc.balance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Nenhuma conta bancária conectada</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Conecte seu banco com o botão acima para sincronizar contas correntes, cartões e investimentos em tempo real.
              </p>
            </div>
          )}
        </section>

        {/* Extrato de Transações */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold tracking-tight">Extrato de Transações</h2>
            </div>
            {transactions.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                {transactions.length} transações recentes
              </span>
            )}
          </div>

          {transactions.length > 0 ? (
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden"
              data-testid="transactions-feed"
            >
              {transactions.map((tx) => {
                const isIncome = tx.type === 'CREDIT' || tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    data-testid={`transaction-item-${tx.id}`}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>{formatDate(tx.date)}</span>
                          {tx.category && (
                            <>
                              <span>&bull;</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                                {tx.category}
                              </span>
                            </>
                          )}
                          {tx.bankName && (
                            <>
                              <span className="hidden sm:inline">&bull;</span>
                              <span className="hidden sm:inline text-slate-500">{tx.bankName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <span
                        className={`font-bold text-sm sm:text-base ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">Nenhuma transação registrada</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {accounts.length > 0
                  ? 'Suas contas estão sincronizadas. As transações recentes serão exibidas no extrato à medida que forem movimentadas.'
                  : 'Para ver o extrato unificado de suas contas e despesas, conecte seu primeiro banco com o Pluggy Connect.'}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        Healthinance &bull; Usuário: {userEmail} &bull; Autenticado via Supabase Auth
      </footer>
    </div>
  );
}
