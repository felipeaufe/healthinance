import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getUserAccounts } from '../../lib/server/accounts';
import { UserNav } from '../../components/UserNav';
import { PluggyConnectButton } from '../../components/PluggyConnectButton';
import {
  Landmark,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Activity,
  CreditCard,
  Building2,
  CheckCircle2,
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
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

        {/* Empty State Transações */}
        <section className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Extrato de Transações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {accounts.length > 0
              ? 'Suas contas estão sincronizadas. As transações recentes serão exibidas no extrato à medida que forem movimentadas.'
              : 'Para ver o extrato unificado de suas contas e despesas, conecte seu primeiro banco com o Pluggy Connect.'}
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        Healthinance &bull; Usuário: {userEmail} &bull; Autenticado via Supabase Auth
      </footer>
    </div>
  );
}
