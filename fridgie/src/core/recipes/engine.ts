// ─── Motor de recetas (lógica pura, sin dependencias externas) ────────────
// Compartido entre web, PWA y futuro escritorio.

import type { Ingredient, Recipe } from '../types';

/** Normaliza texto para comparaciones tolerantes (tildes, mayúsculas, plurales básicos). */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/s$/, ''); // plural simple en ES/EN
}

/** ¿La despensa cubre un ingrediente de la receta? */
export function hasInStock(
  need: { name: string; quantity: number; unit: string },
  pantry: Ingredient[],
): boolean {
  const matches = pantry.filter((i) => normalize(i.name) === normalize(need.name));
  if (matches.length === 0) return false;
  const total = matches.reduce((acc, i) => acc + i.quantity, 0);
  // Las unidades distintas se tratan como compatibles solo si ambas son 'ud' o ambas de peso/volumen
  const sameUnit = matches.some((i) => i.unit === need.unit);
  return sameUnit ? total >= need.quantity : need.quantity <= 0;
}

export interface RecipeMatch {
  recipe: Recipe;
  covered: number;      // ingredientes disponibles
  missing: { name: string; quantity: number; unit: string }[];
  score: number;        // 0..1
}

/** Sugerencia determinista según la despensa (funciona OFFLINE). */
export function suggestRecipes(recipes: Recipe[], pantry: Ingredient[]): RecipeMatch[] {
  return recipes
    .filter((r) => !r.deleted)
    .map((recipe) => {
      const missing = recipe.ingredients.filter((n) => !hasInStock(n, pantry));
      const covered = recipe.ingredients.length - missing.length;
      const score = recipe.ingredients.length ? covered / recipe.ingredients.length : 0;
      return { recipe, covered, missing, score };
    })
    .sort((a, b) => b.score - a.score || a.recipe.title.localeCompare(b.recipe.title));
}

/** Recetas que puedes hacer AHORA (todos los ingredientes en despensa). */
export function cookableNow(recipes: Recipe[], pantry: Ingredient[]): Recipe[] {
  return suggestRecipes(recipes, pantry).filter((m) => m.missing.length === 0).map((m) => m.recipe);
}

/** Búsqueda por título, tag o ingrediente. */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = normalize(query);
  if (!q) return recipes.filter((r) => !r.deleted);
  return recipes.filter(
    (r) =>
      !r.deleted &&
      (normalize(r.title).includes(q) ||
        r.tags.some((t) => normalize(t).includes(q)) ||
        r.ingredients.some((i) => normalize(i.name).includes(q))),
  );
}
