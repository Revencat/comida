// ─── Aplicar un ticket revisado a despensa + lista "Recién comprado" ──────
// Lógica pura: calcula los cambios; la UI los persiste vía store (IndexedDB
// primero → sincronización diferida). Nada se pierde si luego cae la red.

import type { Ingredient, ListItem, ShoppingList } from '../types';
import { addIngredient } from '../ingredients/manager';
import type { ReceiptLine } from './parser';
import { matchReceiptLine } from './matcher';

export interface ApplyResult {
  ingredients: Ingredient[];   // array completo resultante de la despensa
  changedIngredients: Ingredient[]; // solo las creadas/actualizadas (a persistir)
  list: ShoppingList;
  items: ListItem[];           // productos marcados como comprados
}

/** Construye una nueva lista de la compra con los productos del ticket. */
export function buildPurchaseList(receiptName: string | undefined, lines: ReceiptLine[]): { list: ShoppingList; items: ListItem[] } {
  const now = Date.now();
  const day = new Date(now).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const list: ShoppingList = {
    id: crypto.randomUUID(),
    name: receiptName ? `Compra · ${receiptName}` : `Compra · ${day}`,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };
  const items: ListItem[] = lines.map((l) => ({
    id: crypto.randomUUID(),
    listId: list.id,
    name: l.name,
    quantity: l.quantity,
    unit: l.unit,
    checked: true,               // ya comprados: el ticket es la prueba
    updatedAt: now,
    syncStatus: 'pending',
  }));
  return { list, items };
}

/** Aplica las líneas incluidas a la despensa (suma cantidades a existentes). */
export function applyLinesToPantry(pantry: Ingredient[], lines: ReceiptLine[]): { next: Ingredient[]; changed: Ingredient[] } {
  let next = pantry;
  const touchedIds = new Set<string>();
  for (const l of lines) {
    const m = matchReceiptLine(l, next);
    if (m.ingredient) {
      const before = next.find((i) => i.id === m.ingredient!.id)!;
      const updated: Ingredient = {
        ...before,
        quantity: before.quantity + l.quantity,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      };
      next = next.map((i) => (i.id === updated.id ? updated : i));
      touchedIds.add(updated.id);
    } else {
      const created: Ingredient = {
        id: crypto.randomUUID(),
        name: m.canonicalName,
        quantity: l.quantity,
        unit: l.unit,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      };
      next = [...next, created];
      touchedIds.add(created.id);
    }
  }
  const changed = next.filter((i) => touchedIds.has(i.id));
  return { next, changed };
}

/** Helper para reutilizar addIngredient sin duplicar reglas de suma. */
export function mergeIntoPantry(pantry: Ingredient[], line: ReceiptLine): Ingredient[] {
  const m = matchReceiptLine(line, pantry);
  return addIngredient(pantry, m.canonicalName, line.quantity, line.unit);
}
