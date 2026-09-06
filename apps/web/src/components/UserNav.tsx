'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { LogOut, User, Loader2 } from 'lucide-react';

interface UserNavProps {
  email: string;
  name?: string | null;
}

export function UserNav({ email, name }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
        <div className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-[10px]">
          {name ? name[0].toUpperCase() : email[0].toUpperCase()}
        </div>
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
          {name || email}
        </span>
      </div>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-slate-200 dark:border-slate-800 disabled:opacity-50"
        title="Encerrar sessão"
      >
        {loggingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </>
        )}
      </button>
    </div>
  );
}
