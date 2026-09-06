import { createClient } from './supabase/client';
import type { ApiResponse } from '@healthinance/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const supabase = createClient();
  let {
    data: { session },
  } = await supabase.auth.getSession();

  let token = session?.access_token;
  if (!token) {
    const { data: refreshData } = await supabase.auth.refreshSession();
    token = refreshData?.session?.access_token;
  }

  if (!token) {
    return {
      success: false,
      error: 'Sessão expirada ou usuário não autenticado. Por favor, faça login novamente.',
    };
  }

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Authorization', `Bearer ${token}`);

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Erro na requisição (HTTP ${response.status})`,
      };
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Falha na comunicação com o servidor';
    return {
      success: false,
      error: message,
    };
  }
}
