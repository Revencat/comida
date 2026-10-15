// ─── Acceso a Supabase (único punto de contacto con la nube real) ──────────
// La app funciona sin configuración: si no hay credenciales, se usa el modo
// demo local y la UI lo comunica. Las claves públicas van en VITE_* (nunca
// secretos del backend en el paquete de escritorio — ver docs/DESKTOP.md).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '../../core/types';
import type { SyncTransport, PendingOp } from '../../core/sync/engine';

export function supabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    );
  }
  return client;
}

/** Sesión real vía Supabase Auth. Requiere conexión (límite offline honesto). */
export async function supabaseSession(): Promise<Session | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? { userId: u.id, email: u.email ?? '', provider: 'supabase' } : null;
}

/**
 * Transporte Supabase: RPC push_change / pull_changes (SQL en docs/SUPABASE.md).
 * Row Level Security garantiza que cada usuario solo toca SUS datos.
 */
export function createSupabaseTransport(userId: string): SyncTransport {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase no configurado');
  return {
    async push(op: PendingOp): Promise<'ok' | 'conflict'> {
      const { data, error } = await sb.rpc('fridgie_push', {
        p_user: userId,
        p_store: op.store,
        p_id: op.id,
        p_payload: op.payload,
        p_updated_at: op.updatedAt,
      });
      if (error) throw new Error(error.message);
      return (data as string) === 'conflict' ? 'conflict' : 'ok';
    },
    async pull(since: number) {
      const { data, error } = await sb.rpc('fridgie_pull', { p_user: userId, p_since: since });
      if (error) throw new Error(error.message);
      return (data ?? []) as Awaited<ReturnType<SyncTransport['pull']>>;
    },
  };
}
