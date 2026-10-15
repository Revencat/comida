// ─── Tipos de dominio compartidos (web · PWA · escritorio) ────────────────
// Este módulo NO depende de React, del navegador ni de Supabase.

export type SyncStatus = 'synced' | 'pending' | 'conflict';

/** Ingrediente de la despensa */
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;              // 'g', 'ml', 'ud', ...
  expiresAt?: string;        // ISO date
  updatedAt: number;         // epoch ms — base para LWW
  deleted?: boolean;         // borrado lógico (tumba) para sincronizar eliminaciones
  syncStatus: SyncStatus;
}

/** Receta guardada localmente (cache offline de recetas) */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
  servings: number;
  tags: string[];
  favorite: boolean;
  imageEmoji?: string;       // símbolo simple mientras no haya foto
  updatedAt: number;
  deleted?: boolean;
  syncStatus: SyncStatus;
}

/** Producto de una lista de la compra */
export interface ListItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;          // marcado como comprado (editable offline)
  updatedAt: number;
  deleted?: boolean;
  syncStatus: SyncStatus;
}

/** Lista de la compra */
export interface ShoppingList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
  syncStatus: SyncStatus;
}

/** Preferencias del usuario */
export interface Preferences {
  id: string;                // fijo: 'user'
  language: 'es' | 'en';
  theme: 'light';            // FRIDGIE es blanco y luminoso
  dietaryTags: string[];     // 'vegetariano', 'sin gluten'...
  units: 'metric' | 'imperial';
  updatedAt: number;
  syncStatus: SyncStatus;
}

/** Estado global de sincronización expuesto a la UI */
export interface SyncState {
  online: boolean;
  pendingCount: number;
  conflicts: ConflictInfo[];
  lastSyncAt: number | null;
  syncing: boolean;
  error: string | null;
}

/** Conflicto detectado al sincronizar (resolución explícita, nunca silenciosa) */
export interface ConflictInfo {
  entity: 'ingredient' | 'recipe' | 'listItem' | 'shoppingList' | 'preferences';
  entityId: string;
  label: string;             // nombre legible para la UI
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  resolution: 'local' | 'remote' | null; // elegido por el usuario
}

/** Sesión de usuario (abstracción — ver core/auth.ts) */
export interface Session {
  userId: string;
  email: string;
  provider: 'supabase' | 'demo';
}
