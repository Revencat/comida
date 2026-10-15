// ─── Store global de FRIDGIE (Context + useReducer) ────────────────────────
// Estado reactivo de la UI. La lógica pesada vive en core/; aquí solo orquestación.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react';
import type {
  Ingredient, Recipe, ShoppingList, ListItem, Preferences, SyncState, ConflictInfo, Session,
} from './core/types';
import { STORES, getAllActive, bulkPut, putEntity, getMeta, setMeta, countPending } from './core/storage';
import { SEED_RECIPES } from './core/recipes/catalog';
import { runSyncCycle, resolveConflict as resolveConflictCore, type SyncTransport } from './core/sync/engine';
import { createDemoTransport } from './services/demoTransport';
import { supabaseConfigured, supabaseSession, createSupabaseTransport } from './services/supabase/client';
import { platform } from './platform/capabilities';

interface AppState {
  loaded: boolean;
  ingredients: Ingredient[];
  recipes: Recipe[];
  lists: ShoppingList[];
  items: ListItem[];
  prefs: Preferences;
  session: Session | null;
}

type Action =
  | { type: 'loaded'; payload: Omit<AppState, 'loaded'> }
  | { type: 'ingredients'; payload: Ingredient[] }
  | { type: 'recipes'; payload: Recipe[] }
  | { type: 'lists'; payload: ShoppingList[] }
  | { type: 'items'; payload: ListItem[] }
  | { type: 'prefs'; payload: Preferences }
  | { type: 'session'; payload: Session | null };

const defaultPrefs: Preferences = {
  id: 'user', language: 'es', theme: 'light', dietaryTags: [], units: 'metric',
  updatedAt: Date.now(), syncStatus: 'synced',
};

const initial: AppState = {
  loaded: false, ingredients: [], recipes: [], lists: [], items: [],
  prefs: defaultPrefs, session: null,
};

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'loaded': return { ...s, ...a.payload, loaded: true };
    case 'ingredients': return { ...s, ingredients: a.payload };
    case 'recipes': return { ...s, recipes: a.payload };
    case 'lists': return { ...s, lists: a.payload };
    case 'items': return { ...s, items: a.payload };
    case 'prefs': return { ...s, prefs: a.payload };
    case 'session': return { ...s, session: a.payload };
  }
}

export interface Store extends AppState {
  online: boolean;
  sync: SyncState;
  cloudMode: 'supabase' | 'demo';
  refresh: () => Promise<void>;
  saveIngredient: (i: Ingredient) => Promise<void>;
  saveRecipe: (r: Recipe) => Promise<void>;
  saveList: (l: ShoppingList) => Promise<void>;
  saveItem: (it: ListItem) => Promise<void>;
  savePrefs: (p: Preferences) => Promise<void>;
  /** Persiste un lote de entidades en IndexedDB y refresca la UI de una vez
   *  (usado por la importación de tickets: no se pierde nada si luego cae la red). */
  saveMany: (args: { ingredients?: Ingredient[]; lists?: ShoppingList[]; items?: ListItem[] }) => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (c: ConflictInfo, choice: 'local' | 'remote') => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

async function seedIfNeeded() {
  const seeded = await getMeta<boolean>('seeded-v1');
  if (!seeded) {
    await Promise.all(SEED_RECIPES.map((r) => putEntity(STORES.recipes, r)));
    const now = Date.now();
    const demoList: ShoppingList = {
      id: 'list-demo', name: 'Compra semanal', createdAt: now, updatedAt: now, syncStatus: 'synced',
    };
    await putEntity(STORES.lists, demoList);
    const pantry: Ingredient[] = [
      { id: 'pan-1', name: 'Huevos', quantity: 10, unit: 'ud', updatedAt: now, syncStatus: 'synced' },
      { id: 'pan-2', name: 'Patata', quantity: 800, unit: 'g', expiresAt: new Date(now + 6 * 864e5).toISOString(), updatedAt: now, syncStatus: 'synced' },
      { id: 'pan-3', name: 'Cebolla', quantity: 3, unit: 'ud', updatedAt: now, syncStatus: 'synced' },
      { id: 'pan-4', name: 'Aceite de oliva', quantity: 500, unit: 'ml', updatedAt: now, syncStatus: 'synced' },
      { id: 'pan-5', name: 'Sal', quantity: 300, unit: 'g', updatedAt: now, syncStatus: 'synced' },
    ];
    await Promise.all(pantry.map((i) => putEntity(STORES.ingredients, i)));
    await setMeta('seeded-v1', true);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [online, setOnline] = useState(navigator.onLine);
  const [sync, setSync] = useState<SyncState>({
    online: navigator.onLine, pendingCount: 0, conflicts: [], lastSyncAt: null, syncing: false, error: null,
  });
  const transportRef = useRef<SyncTransport | null>(null);
  const busyRef = useRef(false);

  const cloudMode = supabaseConfigured() ? 'supabase' : 'demo';

  async function getTransport(): Promise<SyncTransport> {
    if (transportRef.current) return transportRef.current;
    if (cloudMode === 'supabase') {
      const s = await supabaseSession();
      if (s) transportRef.current = createSupabaseTransport(s.userId);
    }
    transportRef.current ??= createDemoTransport();
    return transportRef.current;
  }

  const refresh = useCallback(async () => {
    await seedIfNeeded();
    const [ingredients, recipes, lists, items, prefsRaw, lastSyncAt] = await Promise.all([
      getAllActive(STORES.ingredients),
      getAllActive(STORES.recipes),
      getAllActive(STORES.lists),
      getAllActive(STORES.listItems),
      getAllActive(STORES.preferences),
      getMeta<number>('lastSyncAt'),
    ]);
    const prefs = prefsRaw[0] ?? defaultPrefs;
    dispatch({ type: 'loaded', payload: { ingredients, recipes, lists, items, prefs, session: stateRef.current.session } });
    const pendingCount = await countPending();
    setSync((prev) => ({ ...prev, lastSyncAt: lastSyncAt ?? null, pendingCount }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Guarda una entidad en IndexedDB (cola offline) y actualiza la UI de inmediato. */
  const persistAndDispatch = useCallback(async (store: string, value: object, action: Action) => {
    await putEntity(store as never, value as never);
    dispatch(action);
    const pendingCount = await countPending();
    setSync((prev) => ({ ...prev, pendingCount }));
  }, []);

  const syncNow = useCallback(async () => {
    if (busyRef.current || !navigator.onLine) return;
    busyRef.current = true;
    setSync((p) => ({ ...p, syncing: true, error: null }));
    try {
      const t = await getTransport();
      const res = await runSyncCycle(t);
      await refresh();
      setSync((p) => ({
        ...p,
        conflicts: [...p.conflicts.filter((c) => !res.conflicts.some((n) => n.entityId === c.entityId)), ...res.conflicts],
        lastSyncAt: Date.now(),
        error: res.error,
      }));
      if (res.pushed || res.pulled) platform.notify(`Sincronizado: ${res.pushed} cambios enviados, ${res.pulled} recibidos.`);
      if (res.conflicts.length) platform.notify(`${res.conflicts.length} conflicto(s) requieren tu decisión.`);
    } finally {
      busyRef.current = false;
      setSync((p) => ({ ...p, syncing: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const resolveConflict = useCallback(async (c: ConflictInfo, choice: 'local' | 'remote') => {
    const t = await getTransport();
    await resolveConflictCore(c, choice, t);
    setSync((p) => ({ ...p, conflicts: p.conflicts.filter((x) => x.entityId !== c.entityId) }));
    await refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    refresh().catch(console.error);
    const goOnline = () => { setOnline(true); setSync((p) => ({ ...p, online: true })); syncNow(); };
    const goOffline = () => { setOnline(false); setSync((p) => ({ ...p, online: false })); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    // Reintentos suaves mientras haya pendientes y conexión
    const iv = setInterval(() => { if (navigator.onLine) void syncNow(); }, 60_000);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(iv);
    };
  }, [refresh, syncNow]);

  const store = useMemo<Store>(() => ({
    ...state,
    online,
    sync,
    cloudMode,
    refresh,
    saveIngredient: (i) => persistAndDispatch(STORES.ingredients, i, { type: 'ingredients', payload: upsert(state.ingredients, i) }),
    saveRecipe: (r) => persistAndDispatch(STORES.recipes, r, { type: 'recipes', payload: upsert(state.recipes, r) }),
    saveList: (l) => persistAndDispatch(STORES.lists, l, { type: 'lists', payload: upsert(state.lists, l) }),
    saveItem: (it) => persistAndDispatch(STORES.listItems, it, { type: 'items', payload: upsert(state.items, it) }),
    savePrefs: (p) => persistAndDispatch(STORES.preferences, p, { type: 'prefs', payload: p }),
    saveMany: async ({ ingredients = [], lists = [], items = [] }) => {
      await Promise.all([
        ingredients.length ? bulkPut(STORES.ingredients, ingredients) : Promise.resolve(),
        lists.length ? bulkPut(STORES.lists, lists) : Promise.resolve(),
        items.length ? bulkPut(STORES.listItems, items) : Promise.resolve(),
      ]);
      if (ingredients.length) dispatch({ type: 'ingredients', payload: mergeAll(stateRef.current.ingredients, ingredients) });
      if (lists.length) dispatch({ type: 'lists', payload: [...stateRef.current.lists, ...lists] });
      if (items.length) dispatch({ type: 'items', payload: [...stateRef.current.items, ...items] });
      const pendingCount = await countPending();
      setSync((prev) => ({ ...prev, pendingCount }));
    },
    syncNow,
    resolveConflict,
  }), [state, online, sync, cloudMode, refresh, persistAndDispatch, syncNow, resolveConflict]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

function upsert<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const copy = [...arr];
  copy[i] = item;
  return copy;
}

/** Sustituye/inserta en bloque preservando el resto del array. */
function mergeAll<T extends { id: string }>(arr: T[], items: T[]): T[] {
  const map = new Map(arr.map((x) => [x.id, x]));
  for (const it of items) map.set(it.id, it);
  return [...map.values()];
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
