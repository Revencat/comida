// ─── Gestión de listas de la compra (lógica de negocio pura) ───────────────
// Edición local y marcado de comprados: funciona SIN CONEXIÓN.
import type { ListItem, ShoppingList } from '../types';

export function createList(name: string): ShoppingList {
  const now = Date.now();
  return { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now, syncStatus: 'pending' };
}

export function addItem(
  items: ListItem[], listId: string, name: string, quantity = 1, unit = 'ud',
): ListItem[] {
  const existing = items.find(
    (i) => !i.deleted && i.listId === listId && i.name.toLowerCase() === name.toLowerCase(),
  );
  const now = Date.now();
  if (existing) {
    return items.map((i) =>
      i.id === existing.id ? { ...i, quantity: i.quantity + quantity, updatedAt: now, syncStatus: 'pending' } : i,
    );
  }
  return [
    ...items,
    { id: crypto.randomUUID(), listId, name, quantity, unit, checked: false, updatedAt: now, syncStatus: 'pending' },
  ];
}

/** Marcar/desmarcar como comprado — operación offline por excelencia. */
export function toggleChecked(items: ListItem[], id: string): ListItem[] {
  const now = Date.now();
  return items.map((i) =>
    i.id === id ? { ...i, checked: !i.checked, updatedAt: now, syncStatus: 'pending' as const } : i,
  );
}

export function removeItem(items: ListItem[], id: string): ListItem[] {
  const now = Date.now();
  return items.map((i) =>
    i.id === id ? { ...i, deleted: true, updatedAt: now, syncStatus: 'pending' as const } : i,
  );
}

export function progress(items: ListItem[], listId: string): { done: number; total: number } {
  const active = items.filter((i) => !i.deleted && i.listId === listId);
  return { done: active.filter((i) => i.checked).length, total: active.length };
}

/** Genera productos para una receta cuyos ingredientes faltan en la despensa. */
export function itemsFromMissing(
  missing: { name: string; quantity: number; unit: string }[], listId: string,
): ListItem[] {
  const now = Date.now();
  return missing.map((m) => ({
    id: crypto.randomUUID(), listId, name: m.name, quantity: m.quantity, unit: m.unit,
    checked: false, updatedAt: now, syncStatus: 'pending' as const,
  }));
}
