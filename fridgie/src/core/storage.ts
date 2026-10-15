// ─── Capa de almacenamiento local (IndexedDB vía `idb`) ───────────────────
// Compartida entre web/PWA y futuro escritorio (Tauri WebView soporta IndexedDB).
// Conserva los cambios offline hasta que la sincronización los confirme.

import { openDB, type IDBPDatabase } from 'idb';
import type {
  Ingredient, Recipe, ShoppingList, ListItem, Preferences,
} from './types';

const DB_NAME = 'fridgie-local';
const DB_VERSION = 1;

export const STORES = {
  ingredients: 'ingredients',
  recipes: 'recipes',
  lists: 'lists',
  listItems: 'listItems',
  preferences: 'preferences',
  meta: 'meta',            // claves sueltas: lastSyncAt, seedVersion…
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const key of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(key)) {
            db.createObjectStore(key, { keyPath: key === 'meta' ? 'k' : 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

type EntityMap = {
  ingredients: Ingredient;
  recipes: Recipe;
  lists: ShoppingList;
  listItems: ListItem;
  preferences: Preferences;
};

export async function putEntity<K extends keyof EntityMap>(
  store: K, value: EntityMap[K],
): Promise<void> {
  const db = await getDb();
  await db.put(store, value);
}

export async function bulkPut<K extends keyof EntityMap>(
  store: K, values: EntityMap[K][],
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done]);
}

export async function getAllActive<K extends keyof EntityMap>(
  store: K,
): Promise<EntityMap[K][]> {
  const db = await getDb();
  const all = (await db.getAll(store)) as (EntityMap[K] & { deleted?: boolean })[];
  return all.filter((e) => !e.deleted) as EntityMap[K][];
}

export async function getById<K extends keyof EntityMap>(
  store: K, id: string,
): Promise<EntityMap[K] | undefined> {
  const db = await getDb();
  const value = await db.get(store, id);
  return value as EntityMap[K] | undefined;
}

export async function deleteEntity(
  store: keyof EntityMap, id: string,
): Promise<void> {
  const db = await getDb();
  await db.delete(store, id);
}

/** Borrado lógico (necesario para propagar eliminaciones en la sincronización) */
export async function softDelete(
  store: keyof EntityMap, id: string, now = Date.now(),
): Promise<void> {
  const db = await getDb();
  const value = await db.get(store, id);
  if (value) {
    value.deleted = true;
    value.updatedAt = now;
    value.syncStatus = 'pending';
    await db.put(store, value);
  }
}

// ─── Meta ──────────────────────────────────────────────────────────────────
export async function setMeta(k: string, v: unknown): Promise<void> {
  const db = await getDb();
  await db.put(STORES.meta, { k, v });
}

export async function getMeta<T = unknown>(k: string): Promise<T | undefined> {
  const db = await getDb();
  const rec = await db.get(STORES.meta, k);
  return rec?.v as T | undefined;
}

/** Cuenta entidades pendientes de subir (para el indicador de la UI) */
export async function countPending(): Promise<number> {
  const db = await getDb();
  let n = 0;
  for (const store of [
    STORES.ingredients, STORES.recipes, STORES.lists, STORES.listItems, STORES.preferences,
  ] as (keyof EntityMap)[]) {
    const all = (await db.getAll(store)) as { syncStatus?: string }[];
    n += all.filter((e) => e.syncStatus === 'pending').length;
  }
  return n;
}
