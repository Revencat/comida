// ─── Transporte de sincronización DEMO (sin backend) ───────────────────────
// Simula una nube local en localStorage para que la app sea utilizable sin
// configurar Supabase. NO finge ser una nube real: la UI indica claramente
// cuándo está activa la capa demo y cuándo la sincronización requiere conexión.

import type { SyncTransport, PendingOp } from '../core/sync/engine';

const KEY = 'fridgie-demo-cloud';

type CloudRow = { id: string; updatedAt: number; deleted?: boolean; [k: string]: unknown };
type Cloud = Record<string, Record<string, CloudRow>>; // store -> id -> row

function load(): Cloud {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}
function save(c: Cloud) { localStorage.setItem(KEY, JSON.stringify(c)); }

export function createDemoTransport(): SyncTransport {
  return {
    async push(op: PendingOp): Promise<'ok' | 'conflict'> {
      await new Promise((r) => setTimeout(r, 30)); // latencia simulada honesta
      const cloud = load();
      const rows = (cloud[op.store] ??= {});
      const remote = rows[op.id];
      if (remote && remote.updatedAt > op.updatedAt) return 'conflict';
      rows[op.id] = { ...(op.payload as CloudRow), syncStatus: undefined } as CloudRow;
      rows[op.id].updatedAt = op.updatedAt;
      save(cloud);
      return 'ok';
    },
    async pull(since: number) {
      const cloud = load();
      return Object.entries(cloud).map(([store, rows]) => ({
        store,
        records: Object.values(rows).filter((r) => r.updatedAt > since),
      })).filter((b) => b.records.length > 0);
    },
  };
}
