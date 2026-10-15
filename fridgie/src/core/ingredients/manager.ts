// ─── Gestión de la despensa (lógica de negocio pura) ───────────────────────
import type { Ingredient } from '../types';

export function addIngredient(
  pantry: Ingredient[], name: string, quantity: number, unit: string, expiresAt?: string,
): Ingredient[] {
  const existing = pantry.find(
    (i) => !i.deleted && i.name.toLowerCase() === name.toLowerCase() && i.unit === unit,
  );
  const now = Date.now();
  if (existing) {
    return pantry.map((i) =>
      i.id === existing.id ? { ...i, quantity: i.quantity + quantity, updatedAt: now, syncStatus: 'pending' } : i,
    );
  }
  return [
    ...pantry,
    { id: crypto.randomUUID(), name, quantity, unit, expiresAt, updatedAt: now, syncStatus: 'pending' },
  ];
}

export function consumeIngredient(
  pantry: Ingredient[], id: string, amount: number,
): Ingredient[] {
  const now = Date.now();
  return pantry.map((i) => {
    if (i.id !== id) return i;
    const remaining = Math.max(0, i.quantity - amount);
    return { ...i, quantity: remaining, updatedAt: now, syncStatus: 'pending' as const };
  });
}

/** Ingredientes caducados o a punto de caducar (≤ N días). */
export function expiringSoon(pantry: Ingredient[], days = 3): Ingredient[] {
  const limit = Date.now() + days * 86_400_000;
  return pantry.filter(
    (i) => !i.deleted && i.expiresAt && new Date(i.expiresAt).getTime() <= limit,
  );
}

export function removeIngredient(pantry: Ingredient[], id: string): Ingredient[] {
  const now = Date.now();
  return pantry.map((i) =>
    i.id === id ? { ...i, deleted: true, updatedAt: now, syncStatus: 'pending' as const } : i,
  );
}
