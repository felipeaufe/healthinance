'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface PluggyConnectButtonProps {
  onSuccess?: (itemData: { item: { id: string } }) => void;
  onError?: (error: unknown) => void;
}

declare global {
  interface Window {
    PluggyConnect?: any;
  }
}

export function PluggyConnectButton({
  onSuccess,
  onError,
}: PluggyConnectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPluggyScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.PluggyConnect) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('pluggy-connect-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'pluggy-connect-script';
      script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2.8.2/pluggy-connect.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar o script do Pluggy Connect (CDN)'));
      document.body.appendChild(script);
    });
  };

  const handleOpenConnect = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Carrega o script do widget Pluggy Connect caso ainda não esteja em memória
      await loadPluggyScript();

      // 2. Solicita o Connect Token efêmero à nossa API Fastify com o JWT do Supabase
      const res = await apiFetch<{ accessToken: string }>('/api/pluggy/connect-token', {
        method: 'POST',
      });

      if (!res.success || !res.data?.accessToken) {
        throw new Error(res.error || 'Falha ao obter token do Pluggy Connect');
      }

      const connectToken = res.data.accessToken;

      // 3. Inicializa o widget seguro do Pluggy Connect
      const pluggyConnect = new window.PluggyConnect({
        connectToken,
        includeSandbox: true,
        onSuccess: async (data: { item: { id: string } }) => {
          try {
            setSyncing(true);
            // Sincroniza imediatamente o item recém-conectado e suas contas
            const syncRes = await apiFetch(`/api/pluggy/items/${data.item.id}/sync`, {
              method: 'POST',
            });

            if (!syncRes.success) {
              console.warn('Aviso na sincronização pós-conexão:', syncRes.error || syncRes.message);
            }
          } catch (syncErr) {
            console.error('Falha ao sincronizar contas pós-conexão:', syncErr);
          } finally {
            setSyncing(false);
            setLoading(false);
            router.refresh();
            onSuccess?.(data);
          }
        },
        onError: (err: unknown) => {
          setLoading(false);
          setSyncing(false);
          onError?.(err);
        },
        onClose: () => {
          setLoading(false);
          setSyncing(false);
        },
      });

      pluggyConnect.init();
    } catch (err: unknown) {
      setLoading(false);
      setSyncing(false);
      const msg = err instanceof Error ? err.message : 'Erro ao inicializar conexão bancária';
      setErrorMsg(msg);
      onError?.(err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleOpenConnect}
        disabled={loading || syncing}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 active:scale-[0.98] transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sincronizando dados bancários...
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Landmark className="w-5 h-5" />
            Conectar Conta Bancária (Open Finance)
          </>
        )}
      </button>

      {errorMsg && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded-md">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
