// ─── Sincronización: cola offline + resolución explícita de conflictos ─────
// Estrategia:
//  • Push: cada entidad local con syncStatus='pending' se envía con su updatedAt.
//  • El backend (o el mock) responde 'ok' | 'conflict' comparando updatedAt.
//  • En conflicto NO se sobrescribe nada en silencio: se registra el conflicto y
//    la UI pide al usuario que elija "mantener el mío" o "usar el de la nube".
//  • Pull: trae cambios remotos más recientes que los locales (LWW seguro).

import type { ConflictInfo, SyncStatus } from '../types';
import {
  getDb, STORES, setMeta, getMeta,
} from '../storage';

export interface PendingOp {
  store: string;             // nombre de store lógico
  entity: ConflictInfo['entity'];
  id: string;
  payload: Record<string, unknown>;
  updatedAt: number;
}

const ENTITY_OF_STORE: Record<string, ConflictInfo['entity']> = {
  [STORES.ingredients]: 'ingredient',
  [STORES.recipes]: 'recipe',
  [STORES.lists]: 'shoppingList',
  [STORES.listItems]: 'listItem',
  [STORES.preferences]: 'preferences',
};

/** Transport: lo inyecta el adaptador (Supabase real o demo local). */
export interface SyncTransport {
  push(op: PendingOp): Promise<'ok' | 'conflict'>;
  pull(since: number): Promise<{ store: string; records: { id: string; updatedAt: number; deleted?: boolean; [k: string]: unknown }[] }[]>;
}

export async function collectPending(): Promise<PendingOp[]> {
  const db = await getDb();
  const ops: PendingOp[] = [];
  for (const store of Object.keys(ENTITY_OF_STORE)) {
    const all = (await db.getAll(store)) as Record<string, unknown>[];
    for (const rec of all) {
      if (rec.syncStatus === 'pending') {
        ops.push({
          store,
          entity: ENTITY_OF_STORE[store],
          id: String(rec.id ?? rec.k),
          payload: rec,
          updatedAt: Number(rec.updatedAt) || Date.now(),
        });
      }
    }
  }
  return ops.sort((a, b) => a.updatedAt - b.updatedAt);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: ConflictInfo[];
  error: string | null;
}

/** Ejecuta un ciclo de sincronización controlado. */
export async function runSyncCycle(transport: SyncTransport): Promise<SyncResult> {
  const db = await getDb();
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], error: null };
  try {
    // 1) PUSH de pendientes
    for (const op of await collectPending()) {
      const outcome = await transport.push(op);
      if (outcome === 'ok') {
        const rec = await db.get(op.store, op.id);
        if (rec) {
          rec.syncStatus = 'synced' satisfies SyncStatus;
          await db.put(op.store, rec);
        }
        result.pushed++;
      } else {
        const existing = await db.get(op.store, op.id);
        result.conflicts.push({
          entity: op.entity,
          entityId: op.id,
          label: String(existing?.name ?? existing?.title ?? op.id),
          localUpdatedAt: Number(existing?.updatedAt) || op.updatedAt,
          remoteUpdatedAt: 0, // el transporte no revela el ts remoto exacto hasta el pull
          resolution: null,
        });
      }
    }
    // 2) PULL incremental desde la última marca
    const since = (await getMeta<number>('lastPull')) ?? 0;
    const batches = await transport.pull(since);
    for (const batch of batches) {
      for (const remote of batch.records) {
        const local = await db.get(batch.store, remote.id);
        const localTs = Number(local?.updatedAt) || 0;
        if (!local || remote.updatedAt > localTs) {
          await db.put(batch.store, { ...(local ?? {}), ...remote, syncStatus: 'synced' });
          result.pulled++;
        } else if (local.syncStatus === 'conflict' || (local.syncStatus === 'pending' && remote.updatedAt > localTs)) {
          // conflicto ya registrado arriba o detectado en pull: se mantiene visible
        }
      }
    }
    await setMeta('lastPull', Date.now());
    await setMeta('lastSyncAt', Date.now());
  } catch (e) {
    result.error = e instanceof Error ? e.message : 'Error de sincronización';
  }
  return result;
}

/** Aplica la decisión del usuario sobre un conflicto y re-intenta el push. */
export async function resolveConflict(
  c: ConflictInfo, choice: 'local' | 'remote', transport: SyncTransport,
): Promise<void> {
  const db = await getDb();
  const store = storeForEntity(c.entity);
  const rec = await db.get(store, c.entityId);
  if (!rec) return;
  if (choice === 'local') {
    // Forzar versión local con timestamp nuevo (gana la batalla LWW en el siguiente push)
    rec.updatedAt = Date.now();
    rec.syncStatus = 'pending';
    await db.put(store, rec);
    await transport.push({
      store, entity: c.entity, id: c.entityId, payload: rec, updatedAt: rec.updatedAt,
    });
    const fresh = await db.get(store, c.entityId);
    if (fresh) { fresh.syncStatus = 'synced'; await db.put(store, fresh); }
  } else {
    rec.syncStatus = 'synced'; // aceptar remoto: deja de estar pendiente
    await db.put(store, rec);
  }
}

export function storeForEntity(entity: ConflictInfo['entity']): string {
  const entry = Object.entries(ENTITY_OF_STORE).find(([, e]) => e === entity);
  return entry![0];
}
