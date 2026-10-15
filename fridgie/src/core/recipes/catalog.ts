// ─── Catálogo local de recetas base (disponible offline tras la primera visita) ─
import type { Recipe } from '../types';

const now = Date.UTC(2025, 0, 1); // fecha fija determinista para el seed

let seq = 0;
const id = () => `seed-${++seq}`;

function r(partial: Omit<Recipe, 'id' | 'updatedAt' | 'syncStatus' | 'deleted'>): Recipe {
  return { id: id(), updatedAt: now, syncStatus: 'synced', ...partial };
}

export const SEED_RECIPES: Recipe[] = [
  r({
    title: 'Tortilla de patatas clásica',
    description: 'Jugosa, con cebolla opcional. El básico imprescindible.',
    ingredients: [
      { name: 'patata', quantity: 4, unit: 'ud' },
      { name: 'huevo', quantity: 5, unit: 'ud' },
      { name: 'cebolla', quantity: 1, unit: 'ud' },
      { name: 'aceite de oliva', quantity: 200, unit: 'ml' },
      { name: 'sal', quantity: 5, unit: 'g' },
    ],
    steps: [
      'Pelar y cortar las patatas en láminas de 2 mm.',
      'Confitar en aceite a fuego medio junto con la cebolla 25 min.',
      'Batir los huevos con sal y mezclar con la patata templada.',
      'Cuajar 3-4 min por lado en una sartén antiadherente.',
    ],
    servings: 4, tags: ['española', 'vegetariano', 'básico'], favorite: true, imageEmoji: '🍳',
  }),
  r({
    title: 'Pasta al ajo y aceite',
    description: 'Cena en 15 minutos con lo que casi siempre hay.',
    ingredients: [
      { name: 'pasta', quantity: 320, unit: 'g' },
      { name: 'ajo', quantity: 3, unit: 'ud' },
      { name: 'aceite de oliva', quantity: 60, unit: 'ml' },
      { name: 'sal', quantity: 8, unit: 'g' },
    ],
    steps: [
      'Cocer la pasta al dente en abundante agua con sal.',
      'Dorar el ajo laminado en aceite a fuego bajo.',
      'Mezclar la pasta con el aceite emulsionado y un poco del agua de cocción.',
    ],
    servings: 2, tags: ['italiana', 'rápida', 'vegetariano'], favorite: false, imageEmoji: '🍝',
  }),
  r({
    title: 'Crema de calabacín',
    description: 'Suave, reconfortante y de temporada.',
    ingredients: [
      { name: 'calabacín', quantity: 3, unit: 'ud' },
      { name: 'patata', quantity: 1, unit: 'ud' },
      { name: 'cebolla', quantity: 1, unit: 'ud' },
      { name: 'caldo de verduras', quantity: 500, unit: 'ml' },
      { name: 'aceite de oliva', quantity: 30, unit: 'ml' },
    ],
    steps: [
      'Pochar la cebolla con el calabacín y la patata en trozos.',
      'Añadir el caldo y cocer 20 minutos.',
      'Triturar hasta conseguir una crema fina y rectificar de sal.',
    ],
    servings: 4, tags: ['vegetariana', 'sopa', 'saludable'], favorite: false, imageEmoji: '🥒',
  }),
  r({
    title: 'Smoothie verde Broc',
    description: 'Desayuno energético con espinacas y plátano. Inspirado en nuestro brócoli favorito.',
    ingredients: [
      { name: 'plátano', quantity: 1, unit: 'ud' },
      { name: 'espinacas', quantity: 50, unit: 'g' },
      { name: 'yogur natural', quantity: 150, unit: 'g' },
      { name: 'leche', quantity: 100, unit: 'ml' },
    ],
    steps: ['Triturar todo 40 segundos hasta que quede homogéneo.', 'Servir muy frío.'],
    servings: 1, tags: ['desayuno', 'smoothie', 'vegano-opcional'], favorite: true, imageEmoji: '🥤',
  }),
  r({
    title: 'Arroz salteado de aprovechamiento',
    description: 'El mejor amigo de las sobras de arroz y la nevera a medio vaciar.',
    ingredients: [
      { name: 'arroz', quantity: 300, unit: 'g' },
      { name: 'huevo', quantity: 2, unit: 'ud' },
      { name: 'zanahoria', quantity: 1, unit: 'ud' },
      { name: 'aceite de oliva', quantity: 20, unit: 'ml' },
      { name: 'soja', quantity: 30, unit: 'ml' },
    ],
    steps: [
      'Saltear la zanahoria en dados con fuego fuerte.',
      'Añadir el arroz y desmenuzarlo bien.',
      'Incorporar el huevo batido removiendo rápido y aliñar con soja.',
    ],
    servings: 2, tags: ['aprovechamiento', 'rápida', 'asiática'], favorite: false, imageEmoji: '🍚',
  }),
  r({
    title: 'Tostada de tomate y aguacate',
    description: 'Brunch fácil con pan bueno y producto maduro.',
    ingredients: [
      { name: 'pan', quantity: 2, unit: 'ud' },
      { name: 'tomate', quantity: 2, unit: 'ud' },
      { name: 'aguacate', quantity: 1, unit: 'ud' },
      { name: 'aceite de oliva', quantity: 15, unit: 'ml' },
    ],
    steps: [
      'Tostar el pan y frotarlo con el tomate cortado.',
      'Machacar el aguacate por encima con sal y AOVE.',
    ],
    servings: 2, tags: ['brunch', 'vegetariana', 'rápida'], favorite: false, imageEmoji: '🥑',
  }),
];
