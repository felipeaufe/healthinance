import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2 mb-8 group transition-transform active:scale-95">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-green-600/20 group-hover:shadow-green-600/30 transition-all">
          H
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Healthinance
        </span>
      </Link>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
        {children}
      </div>

      {/* Security Footer */}
      <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-green-500" />
        <span>Autenticação criptografada via Supabase Auth</span>
      </div>
    </div>
  );
}
