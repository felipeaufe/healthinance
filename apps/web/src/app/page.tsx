import React from 'react';
import { ShieldCheck, TrendingUp, Wallet, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { PluggyConnectButton } from '../components/PluggyConnectButton';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 md:p-24 max-w-6xl mx-auto">
      {/* Header / Nav */}
      <header className="w-full flex items-center justify-between pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-green-500/20">
            H
          </div>
          <span className="text-xl font-bold tracking-tight">Healthinance</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <ShieldCheck className="w-4 h-4" />
          Open Finance Seguro
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center my-12 md:my-16 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Sua saúde financeira em um único lugar.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
          Conecte suas contas bancárias através da Pluggy API com proteção bancária,
          acompanhe suas transações e impulsione sua estabilidade financeira.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <PluggyConnectButton />
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Criptografia de ponta a ponta com credenciais segregadas
          </span>
        </div>
      </section>

      {/* Metric Cards Preview */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Saldo Consolidado</span>
            <Wallet className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">R$ 0,00</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Conecte uma conta para sincronizar</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Transações Sincronizadas</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">0</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Atualizado em tempo real via Webhook</span>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Score Financeiro</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-500">-- / 100</p>
          <span className="text-xs text-slate-400 mt-1 inline-block">Calculado com base no seu fluxo de caixa</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        Healthinance &copy; {new Date().getFullYear()} &bull; Desenvolvido com Next.js, Fastify, Supabase e Pluggy API.
      </footer>
    </main>
  );
}
