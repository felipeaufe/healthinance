import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { UserNav } from '../../components/UserNav';
import { PluggyConnectButton } from '../../components/PluggyConnectButton';
import { Landmark, TrendingUp, Wallet, ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

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
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">R$ 0,00</p>
            <span className="text-xs text-slate-400 mt-1 inline-block">Nenhuma conta bancária sincronizada</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Instituições Conectadas</span>
              <Landmark className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">0 bancos</p>
            <span className="text-xs text-slate-400 mt-1 inline-block">Conecte via Pluggy Open Finance</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
              <span>Índice de Saúde Financeira</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-emerald-500">-- / 100</p>
            <span className="text-xs text-slate-400 mt-1 inline-block">Aguardando dados de fluxo de caixa</span>
          </div>
        </section>

        {/* Empty State / Next Steps */}
        <section className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Nenhuma transação registrada ainda</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Para ver o extrato unificado de suas contas e despesas, clique no botão acima para conectar seu primeiro banco com o Pluggy Connect.
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
