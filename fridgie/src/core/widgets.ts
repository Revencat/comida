// ─── Widgets de FRIDGIE (lógica pura y determinista) ────────────────────────
// Todo depende del momento o de los datos reales: nada inventado, pero la
// interfaz "varía" a lo largo del día de forma honesta. Compartible con Tauri.

import type { Ingredient, ListItem, Recipe } from './types';
import { expiringSoon } from './ingredients/manager';
import { cookableNow } from './recipes/engine';

/** Saludo según la hora local — cambia solo, sin refrescar. */
export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
}

const MEALS = [
  { name: 'Desayuno', from: 5, to: 11, variant: 'happy' as const },
  { name: 'Comida', from: 11, to: 16, variant: 'chef' as const },
  { name: 'Merienda', from: 16, to: 20, variant: 'wink' as const },
  { name: 'Cena', from: 20, to: 24, variant: 'idle' as const },
  { name: 'Madrugada', from: 0, to: 5, variant: 'sleepy' as const },
];

export function currentMeal(d = new Date()) {
  const h = d.getHours();
  const m = MEALS.find((x) => h >= x.from && h < x.to)!;
  return { name: m.name, variant: m.variant };
}

const WEEK_TIPS = [
  'Saltear las verduras a fuego fuerte las mantiene crujientes y vivas.',
  'Congela el pan en rebanadas: dura más y toastas solo lo que necesitas.',
  'Las hierbas frescas aguantan una semana en un vaso con agua, como flores.',
  'Un chorrito de vinagre en el agua mantiene la lechuga fresca y sin amargor.',
  'Guarda las patatas lejos de la cebolla: juntas brotan antes.',
  'Ralla y congela el jengibre: tendrás dosis listas para cualquier receta.',
  'Los tomates, nunca a la nevera: el frío les roba el aroma.',
];

/** Consejo del día — mismo consejo durante toda la jornada, varía al cambiar de día. */
export function tipOfDay(d = new Date()): string {
  const day = Math.floor(d.getTime() / 86_400_000);
  return WEEK_TIPS[day % WEEK_TIPS.length];
}

export interface SeasonInfo { key: 'spring' | 'summer' | 'autumn' | 'winter'; label: string }

/** Estación aproximada (hemisferio norte) — da color e identidad al panel. */
export function seasonOf(d = new Date()): SeasonInfo {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 320 && md < 621) return { key: 'spring', label: 'Primavera · guisantes, espárragos, fresas' };
  if (md >= 621 && md < 923) return { key: 'summer', label: 'Verano · tomate, pepino, sandía' };
  if (md >= 923 && md < 1221) return { key: 'autumn', label: 'Otoño · calabaza, setas, cítricos' };
  return { key: 'winter', label: 'Invierno · col, nabo, legumbres' };
}

export interface MoodState {
  variant: 'idle' | 'happy' | 'wink' | 'sleepy' | 'chef' | 'cart';
  message: string;
}

/** Broc reacciona a datos REALES de la despensa — nunca inventa estados. */
export function brocMood(recipes: Recipe[], pantry: Ingredient[], items: ListItem[], d = new Date()): MoodState {
  const soon = expiringSoon(pantry, 3);
  if (soon.length > 0) {
    return { variant: 'wink', message: `Uf, ${soon[0].name} caduca pronto. ¿Lo cocinamos hoy?` };
  }
  const cookable = cookableNow(recipes, pantry);
  if (cookable.length >= 3) {
    return { variant: 'chef', message: `Tienes ${cookable.length} recetas listas para cocinar ahora mismo.` };
  }
  const unchecked = items.filter((i) => !i.checked && !i.deleted).length;
  if (unchecked > 0) {
    return { variant: 'cart', message: `Quedan ${unchecked} producto(s) por comprar en tu lista.` };
  }
  if (pantry.filter((p) => p.quantity > 0).length === 0) {
    return { variant: 'sleepy', message: 'Tu despensa está medio vacía… yo también necesito comer.' };
  }
  return { variant: currentMeal(d).variant, message: `${currentMeal(d).name}: todo en orden en tu cocina.` };
}

/** Franja horaria real de uso (por horas de guardado local). */
export function timeBand(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return 'madrugada';
  if (h < 12) return 'mañana';
  if (h < 17) return 'mediodía';
  if (h < 21) return 'tarde';
  return 'noche';
}
