// ─── Emparejador producto del ticket → ingrediente de la despensa ──────────
// Determinista y offline: sinónimos en español + coincidencias por prefijo.

import type { Ingredient } from '../types';
import type { ReceiptLine } from './parser';

export type MatchKind = 'exact' | 'synonym' | 'fuzzy' | 'new';

export interface LineMatch {
  kind: MatchKind;
  ingredient?: Ingredient;   // existente en despensa (para sumar cantidad)
  canonicalName: string;     // nombre con el que se guardará
}

// Sinónimos frecuentes en tickets españoles → nombre canónico FRIDGIE
const SYNONYMS: Record<string, string[]> = {
  'tomate': ['tomate', 'tomates', 'tomate rama', 'tomate cherry', 'cherry'],
  'patata': ['patata', 'patatas', 'patata monalisa', 'monalisa'],
  'cebolla': ['cebolla', 'cebollas', 'cebolleta', 'cebolla tierna'],
  'zanahoria': ['zanahoria', 'zanahorias'],
  'calabacín': ['calabacin', 'calabacín', 'zucchini', 'zapallito'],
  'pepino': ['pepino', 'pepinos'],
  'lechuga': ['lechuga', 'iceberg', 'romana', 'oak leaf'],
  'espinacas': ['espinaca', 'espinacas', 'baby espinacas'],
  'brócoli': ['brocoli', 'brócoli', 'brocol', 'brecol'],
  'ajo': ['ajo', 'ajitos', 'ajo moruno'],
  'setas': ['seta', 'setas', 'champiñon', 'champiñones', 'champinon', 'portobello', 'mushroom'],
  'pimiento': ['pimiento', 'pimientos', 'pimiento rojo', 'pimiento verde', 'ñora'],
  'aguacate': ['aguacate', 'aguacates', 'guacamole'],
  'plátano': ['platano', 'plátano', 'platanos', 'banana'],
  'manzana': ['manzana', 'manzanas', 'golden', 'fuji'],
  'naranja': ['naranja', 'naranjas', 'sanguina'],
  'limón': ['limon', 'limón', 'limones'],
  'fresa': ['fresa', 'fresas', 'higo', 'arandano', 'moras', 'frambuesa'],
  'uva': ['uva', 'uvas', 'moscatel'],
  'kiwi': ['kiwi', 'kiwis'],
  'melon': ['melón', 'melon', 'piel de sapo', 'cantalupo'],
  'sandía': ['sandia', 'sandía'],
  'perita': ['pera', 'peras'],
  'leche': ['leche', 'semi', 'entera', 'desnatada', 'oat drink', 'avena', 'soja bebida'],
  'yogur': ['yogur', 'yogurt', 'yogures', 'yoghurt', 'natural', 'griego'],
  'queso': ['queso', 'cheddar', 'mozzarella', 'curado', 'fresco', 'brie', 'parmesano', 'manchego'],
  'huevos': ['huevo', 'huevos'],
  'mantequilla': ['mantequilla', 'margarina'],
  'nata': ['nata', 'crema de leche', 'nata para cocinar'],
  'arroz': ['arroz', 'basmati', 'bomba', 'arborio'],
  'pasta': ['pasta', 'espagueti', 'espaguetis', 'macarron', 'penne', 'tallarines', 'fideos', 'fusilli', 'farfalle', 'lasaña'],
  'pan': ['pan', 'baguette', 'barra de pan', 'panecillos', 'molde', 'brioche'],
  'harina': ['harina', 'maizena', 'levadura'],
  'garbanzos': ['garbanzo', 'garbanzos', 'cocido'],
  'lentejas': ['lenteja', 'lentejas', 'pardina'],
  'alubias': ['alubia', 'alubias', 'judia', 'judias', 'fabes', 'caraota', 'poroto'],
  'aceite de oliva': ['aceite', 'oli', 'aceite de oliva', 'aove', 'virgen extra'],
  'aceite de girasol': ['girasol'],
  'sal': ['sal', 'sal gorda', 'sal fina', 'pimienta'],
  'azúcar': ['azucar', 'azúcar', 'moreno', 'glass'],
  'soja': ['soja', 'salsa de soja', 'shoyu'],
  'atún': ['atun', 'atún', 'bonito', 'sardina', 'anchoa', 'mejillon', 'berberecho'],
  'salmón': ['salmon', 'salmón', 'trucha', 'merluza', 'bacalao', 'pescado'],
  'pollo': ['pollo', 'pechuga', 'muslo', 'contramuslo', 'alitas', 'pavo'],
  'cerdo': ['cerdo', 'jamón', 'jamon', 'paleta', 'lomo', 'costilla', 'bacon', 'tocino', 'chorizo', 'salchichon'],
  'tomate frito': ['sofrito', 'tomate frito', 'salsa tomate', 'ketchup', 'pasata'],
  'legumbre cocida': ['alcachofa', 'guisantes', 'judias verdes', 'esparrago', 'menestra'],
  'café': ['cafe', 'café', 'cappuccino', 'descafeinado'],
  'infusiones': ['manzanilla', 'té', 'te ', 'infusion'],
  'chocolate': ['chocolate', 'cacao', 'nocilla', 'nutella'],
  'galletas': ['galleta', 'galletas', 'maria', 'digestive', 'oreo'],
  'helado': ['helado', 'polo', ' Magnum'],
  'agua': ['agua', 'aquarius', 'sin gas', 'con gas'],
  'refresco': ['coca cola', 'cocacola', 'pepsi', 'fanta', 'nocilla'],
  'cerveza': ['cerveza', 'mahou', 'estrella', 'caña'],
  'vino': ['vino', 'tinto', 'blanco', 'cava', 'rosado'],
  'detergente': ['fairy', ' Finish', 'detergente', 'lavavajillas', 'suavizante', 'amoniaco'],
  'papel higiénico': ['papel', 'servilleta', 'celulosa', 'scottex'],
  'limpiador': ['lysol', 'azofait', 'lejia', 'fregona', 'estropajo'],
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const CANON_KEYS = Object.keys(SYNONYMS);

/** Busca un término dentro del mapa de sinónimos */
export function canonicalize(name: string): string | null {
  const n = norm(name);
  if (!n) return null;
  // 1) coincidencia directa con clave canónica
  for (const key of CANON_KEYS) if (norm(key) === n) return key;
  // 2) dentro de listas de sinónimos
  for (const [key, list] of Object.entries(SYNONYMS)) {
    for (const syn of list) {
      const s = norm(syn);
      if (s && (n === s || n.includes(s) || s.includes(n))) return key;
    }
  }
  return null;
}

/** Compara dos nombres "razonablemente" (prefijo o distancia pequeña) */
function similar(a: string, b: string): boolean {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && (nb.startsWith(na) || na.startsWith(nb))) return true;
  // Levenshtein barato solo para palabras cortas
  if (Math.abs(na.length - nb.length) > 2) return false;
  let diff = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) if (na[i] !== nb[i]) diff++;
  return diff <= 2;
}

/** Decide cómo encajar una línea del ticket en la despensa actual */
export function matchReceiptLine(line: ReceiptLine, pantry: Ingredient[]): LineMatch {
  const canon = canonicalize(line.name);
  const candidates = pantry.filter((i) => !i.deleted);

  // 1) Exacto (nombre normalizado igual, ignorando mayúsculas/acentos)
  const exact = candidates.find((i) => norm(i.name) === norm(canon ?? line.name));
  if (exact) return { kind: canon ? 'synonym' : 'exact', ingredient: exact, canonicalName: exact.name };

  // 2) Canónico: si el ticket dice "CHAMPIÑONES" y tengo "Setas"
  if (canon) {
    const byCanon = candidates.find((i) => norm(i.name) === norm(canon) || canonicalize(i.name) === canon);
    if (byCanon) return { kind: 'synonym', ingredient: byCanon, canonicalName: byCanon.name };
  }

  // 3) Difuso: prefijos/comodines (ej. "Tomate raf" ≈ "Tomate")
  const target = canon ?? line.name;
  const fuzzy = candidates.find((i) => similar(i.name, target));
  if (fuzzy) return { kind: 'fuzzy', ingredient: fuzzy, canonicalName: fuzzy.name };

  // 4) Producto nuevo
  const pretty = target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
  return { kind: 'new', canonicalName: pretty };
}
