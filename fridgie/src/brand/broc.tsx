// ─── Broc — la mascota de FRIDGIE (ilustración vectorial propia) ────────────
// Un brócoli con personalidad: copa esponjosa de tres tonos, tronquito con
// bracitos, carita que parpadea y sonríe. Sin emojis como recurso gráfico.
// `variant` cambia el estado de ánimo según el contexto de la app.
import type { CSSProperties, ReactNode } from 'react';

export type BrocVariant = 'idle' | 'happy' | 'wink' | 'sleepy' | 'chef' | 'cart';

const SKY = '#dff1ff', MINT = '#dcf5e6', BLUSH = '#ffe4d2', LILAC = '#ece7fb', BUTTER = '#fff3d6';

interface Outfit { hat?: boolean; apron?: boolean; cart?: boolean; glasses?: boolean; brows?: boolean; }
const OUTFITS: Record<BrocVariant, Outfit> = {
  idle:   {},
  happy:  { brows: true },
  wink:   {},
  sleepy: {},
  chef:   { hat: true, apron: true },
  cart:   { glasses: true, cart: true },
};

export function Broc({ size = 44, variant = 'idle', title }: { size?: number; variant?: BrocVariant; title?: string }) {
  const o = OUTFITS[variant];
  return (
    <svg className="broc" width={size} height={size} viewBox="0 0 96 96" role="img" aria-label={title ?? 'Broc, la mascota de FRIDGIE'} fill="none">
      {/* aura suave */}
      <circle cx="48" cy="50" r="44" fill="#2fa860" opacity=".07" />
      {o.hat && (
        <g>
          <ellipse cx="48" cy="14.5" rx="16" ry="10" fill="#ffffff" stroke="#1e5c3a" strokeWidth="2.5" />
          <rect x="33" y="17" width="30" height="7" rx="3.5" fill="#ffffff" stroke="#1e5c3a" strokeWidth="2.5" />
        </g>
      )}
      {/* brazos detrás del cuerpo */}
      <path d="M30 52 Q21 55 19 62" stroke="#7cc47c" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M66 52 Q75 55 77 62" stroke="#7cc47c" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="19" cy="63" r="4" fill="#93d18f" stroke="#1e5c3a" strokeWidth="2" />
      <circle cx="77" cy="63" r="4" fill="#93d18f" stroke="#1e5c3a" strokeWidth="2" />
      {/* tronco */}
      <path d="M41 50 Q40 66 43 76 Q48 80 53 76 Q56 66 55 50 Z" fill="#bfe6b4" stroke="#1e5c3a" strokeWidth="2.5" strokeLinejoin="round" />
      {o.apron && (
        <g>
          <path d="M42 58 Q48 55 54 58 L55 74 Q48 78 41 74 Z" fill="#ffffff" stroke="#1e5c3a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 58 Q38 55 36 51 M54 58 Q58 55 60 51" stroke="#1e5c3a" strokeWidth="2" strokeLinecap="round" />
          <path d="M44 66 h8" stroke="#a9dcae" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {/* copa esponjosa — nubes apiladas en tres verdes */}
      <path d="M17 40 a9 9 0 0 1 1 -17.8 a11 11 0 0 1 20 -9 a11 11 0 0 1 20 9 a9 9 0 0 1 1 17.8 a8 8 0 0 1 -10 6 a9 9 0 0 1 -22 0 a8 8 0 0 1 -10 -6 Z"
        fill="#4cb46c" stroke="#1e5c3a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 30 a7 7 0 0 1 6 -11 a9 9 0 0 1 18 -6 a9 9 0 0 1 16 8 a7 7 0 0 1 4 11 a8 8 0 0 1 -8 5 a10 10 0 0 1 -14 3 a10 10 0 0 1 -14 -3 a8 8 0 0 1 -8 -5 Z"
        fill="#37a35e" />
      <path d="M31 24 a5.5 5.5 0 0 1 5 -8.5 a8 8 0 0 1 15 -4 a8 8 0 0 1 13 6 a5.5 5.5 0 0 1 3 8 a7 7 0 0 1 -6 4 a9 9 0 0 1 -12 2 a9 9 0 0 1 -12 -2 a7 7 0 0 1 -6 -4 Z"
        fill="#2b8f52" />
      {/* brotes tiernos */}
      <circle cx="27" cy="22" r="2.6" fill="#6fce8d" />
      <circle cx="68" cy="23" r="2.6" fill="#6fce8d" />
      <circle cx="48" cy="12.5" r="3" fill="#6fce8d" />
      {/* carita sobre la copa */}
      <g className="broc-eyes">
        <ellipse cx="40.5" cy="33" rx="4.6" ry="5.4" fill="#ffffff" stroke="#1e5c3a" strokeWidth="1.6" />
        <ellipse cx="55.5" cy="33" rx="4.6" ry="5.4" fill="#ffffff" stroke="#1e5c3a" strokeWidth="1.6" />
        <circle cx="41.4" cy="34" r="2.3" fill="#1e5c3a" />
        <circle cx="54.6" cy="34" r="2.3" fill="#1e5c3a" />
        <circle cx="42.3" cy="32.8" r=".9" fill="#ffffff" />
        <circle cx="55.5" cy="32.8" r=".9" fill="#ffffff" />
      </g>
      {o.glasses && (
        <g stroke="#1e5c3a" strokeWidth="2" fill="none">
          <circle cx="40.5" cy="33" r="7" /><circle cx="55.5" cy="33" r="7" />
          <path d="M47.5 33 h1 M33.5 33 l-3 -1 M62.5 33 l3 -1" strokeLinecap="round" />
        </g>
      )}
      {o.brows && (
        <g stroke="#1e5c3a" strokeWidth="2" strokeLinecap="round">
          <path d="M36 25.5 q4.5 -2.5 9 -.5" /><path d="M51 25 q4.5 -2 9 .5" />
        </g>
      )}
      {variant === 'wink' ? (
        <path d="M51.5 33 q4 3 8 0" stroke="#1e5c3a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      ) : variant === 'sleepy' ? (
        <g stroke="#1e5c3a" strokeWidth="2.2" strokeLinecap="round">
          <path d="M36.5 33 q4 2.6 8 0" /><path d="M51.5 33 q4 2.6 8 0" />
        </g>
      ) : null}
      <path d="M44 41 q4 4.2 8 0" stroke="#1e5c3a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="33" cy="39.5" r="3" fill="#ffb3c1" opacity=".65" />
      <circle cx="63" cy="39.5" r="3" fill="#ffb3c1" opacity=".65" />
      {/* carrito de la compra */}
      {o.cart && (
        <g>
          <rect x="60" y="56" width="26" height="16" rx="4" fill="#ffffff" stroke="#1e5c3a" strokeWidth="2.5" />
          <path d="M64 56 l2.5 16 M70 56 l1.5 16 M76 56 l1 16" stroke="#1e5c3a" strokeWidth="1.5" />
          <circle cx="66" cy="76" r="3.4" fill="#2b8f52" stroke="#1e5c3a" strokeWidth="2" />
          <circle cx="80" cy="76" r="3.4" fill="#2b8f52" stroke="#1e5c3a" strokeWidth="2" />
          <path d="M60 60 q-6 -2 -8 -8" stroke="#1e5c3a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="71" cy="52" r="3.4" fill="#ffcf56" stroke="#1e5c3a" strokeWidth="1.8" />
          <path d="M77 53 q2 -4 4.5 -1.5" stroke="#6fce8d" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/** Marca FRIDGIE: arco de nevera + hoja — coherente con el icono de la PWA. */
export function FridgieMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="FRIDGIE" fill="none">
      <rect width="512" height="512" rx="112" fill="#ffffff" />
      <path d="M120 432V216a136 136 0 0 1 272 0v216Z" fill="#2fa860" />
      <path d="M120 432V216a136 136 0 0 1 272 0v216Z" stroke="#1b7a43" strokeWidth="20" strokeLinejoin="round" />
      <path d="M256 176c-40 6-64 34-62 66 34 4 66-16 70-50 18 8 28 24 30 42 22-14 26-42 8-58-12-10-30-8-46 0Z" fill="#eaf7ef" />
      <circle cx="352" cy="300" r="20" fill="#eaf7ef" />
    </svg>
  );
}

/** Escena grande para la página Descargar: Broc entre dispositivos. */
export function BrocScene() {
  return (
    <svg className="broc-hero" viewBox="0 0 340 220" role="img" aria-label="Broc junto a un portátil, un móvil y una tablet" fill="none">
      {/* colinas de fondo */}
      <path d="M0 200 Q85 150 170 190 T340 180 V220 H0 Z" fill="#e9f8ef" />
      <path d="M0 212 Q120 178 240 208 T340 200 V220 H0 Z" fill="#d8f0e2" />
      {/* confeti de cocina */}
      <circle cx="38" cy="42" r="5" fill={SKY} /><circle cx="300" cy="34" r="6" fill={BUTTER} />
      <circle cx="318" cy="96" r="4" fill={LILAC} /><circle cx="22" cy="110" r="4" fill={MINT} />
      <path d="M60 20 l4 8 -8 0 Z" fill="#ffd1dc" /><path d="M270 66 l5 9 -10 0 Z" fill="#ffd1dc" />
      <circle cx="150" cy="18" r="3.5" fill="#bfe6b4" /><circle cx="240" cy="14" r="3" fill="#7fd6a2" />
      {/* portátil */}
      <g>
        <rect x="26" y="108" width="118" height="74" rx="10" fill="#ffffff" stroke="#1e5c3a" strokeWidth="4" />
        <rect x="36" y="118" width="98" height="54" rx="6" fill="#f4fbf6" />
        <path d="M14 182 h142 l10 14 H4 Z" fill="#ffffff" stroke="#1e5c3a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M70 188 h30" stroke="#a9dcae" strokeWidth="4" strokeLinecap="round" />
        <rect x="46" y="128" width="44" height="7" rx="3.5" fill="#7fd6a2" />
        <rect x="46" y="142" width="78" height="5" rx="2.5" fill="#dcefe3" />
        <rect x="46" y="153" width="62" height="5" rx="2.5" fill="#dcefe3" />
        <circle cx="118" cy="131" r="5" fill="#ffcf56" stroke="#1e5c3a" strokeWidth="2" />
      </g>
      {/* móvil */}
      <g>
        <rect x="252" y="92" width="44" height="84" rx="10" fill="#ffffff" stroke="#1e5c3a" strokeWidth="4" />
        <rect x="259" y="102" width="30" height="60" rx="5" fill="#f4fbf6" />
        <path d="M264 112 h20 M264 122 h20 M264 132 h13" stroke="#7fd6a2" strokeWidth="4" strokeLinecap="round" />
        <path d="M266 148 l4 4 8 -9" stroke="#2fa860" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="274" cy="88" r="3" fill="#1e5c3a" />
      </g>
      {/* Broc asomado detrás del portátil */}
      <g transform="translate(96 44)">
        <svg width="96" height="96" viewBox="0 0 96 96" overflow="visible">
          <path d="M30 52 Q22 44 20 34" stroke="#7cc47c" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="20" cy="32" r="4" fill="#93d18f" stroke="#1e5c3a" strokeWidth="2" />
          <path d="M41 50 Q40 66 43 76 Q48 80 53 76 Q56 66 55 50 Z" fill="#bfe6b4" stroke="#1e5c3a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M17 40 a9 9 0 0 1 1 -17.8 a11 11 0 0 1 20 -9 a11 11 0 0 1 20 9 a9 9 0 0 1 1 17.8 a8 8 0 0 1 -10 6 a9 9 0 0 1 -22 0 a8 8 0 0 1 -10 -6 Z"
            fill="#4cb46c" stroke="#1e5c3a" strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 30 a7 7 0 0 1 6 -11 a9 9 0 0 1 18 -6 a9 9 0 0 1 16 8 a7 7 0 0 1 4 11 a8 8 0 0 1 -8 5 a10 10 0 0 1 -14 3 a10 10 0 0 1 -14 -3 a8 8 0 0 1 -8 -5 Z"
            fill="#37a35e" />
          <circle cx="40.5" cy="31" r="4.4" fill="#fff" stroke="#1e5c3a" strokeWidth="1.6" />
          <circle cx="55.5" cy="31" r="4.4" fill="#fff" stroke="#1e5c3a" strokeWidth="1.6" />
          <circle cx="41.3" cy="32" r="2.2" fill="#1e5c3a" /><circle cx="54.7" cy="32" r="2.2" fill="#1e5c3a" />
          <path d="M44 39 q4 4 8 0" stroke="#1e5c3a" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="33" cy="37" r="3" fill="#ffb3c1" opacity=".65" /><circle cx="63" cy="37" r="3" fill="#ffb3c1" opacity=".65" />
        </svg>
      </g>
      {/* sombras al suelo */}
      <ellipse cx="88" cy="198" rx="60" ry="7" fill="#2fa860" opacity=".12" />
      <ellipse cx="274" cy="184" rx="26" ry="5" fill="#2fa860" opacity=".12" />
    </svg>
  );
}

/** Ilustraciones pequeñas y variadas para chips, listas y estados vacíos. */
export type FoodKey = 'tomato' | 'avocado' | 'egg' | 'carrot' | 'lemon' | 'mushroom' | 'bread' | 'cheese' | 'garlic' | 'leaf' | 'pepper' | 'banana' | 'potato' | 'onion' | 'fish' | 'chili';
const FOOD_ART: Record<FoodKey, ReactNode> = {
  tomato: (<><circle cx="16" cy="18" r="10.5" fill="#ff6b5e" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M16 8 q-3 -3 -6 -2 q2 3 6 2 Z M16 8 q3 -3 6 -2 q-2 3 -6 2 Z" fill="#37a35e" /><path d="M12 15 q1.5 2 0 4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity=".7" /></>),
  avocado: (<><path d="M16 5 q8 5 8 13 a8 8 0 0 1 -16 0 q0 -8 8 -13 Z" fill="#a9dcae" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M16 9 q5 3.5 5 9 a5 5 0 0 1 -10 0 q0 -5.5 5 -9 Z" fill="#f2ead0" /><circle cx="16" cy="19" r="3.4" fill="#8a5a2b" /></>),
  egg: (<><path d="M16 5 q7 6 7 13 a7 7 0 0 1 -14 0 q0 -7 7 -13 Z" fill="#fdf6e3" stroke="#1e5c3a" strokeWidth="1.6" /><circle cx="16" cy="18" r="3.6" fill="#ffcf56" /></>),
  carrot: (<><path d="M10 10 l12 13 -4 3 -11 -12 Z" fill="#ff9f45" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 9 q-2 -4 1 -5 M11 8 q0 -4 4 -4" stroke="#37a35e" strokeWidth="2" strokeLinecap="round" /></>),
  lemon: (<><ellipse cx="16" cy="16" rx="11" ry="8.5" fill="#ffe15a" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M27 15 q3 0 3 2" stroke="#1e5c3a" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="14" r="1.2" fill="#fff" opacity=".8" /></>),
  mushroom: (<><path d="M6 15 q10 -11 20 0 q-10 4 -20 0 Z" fill="#e8896b" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M13 16 q0 6 3 8 q3 -2 3 -8" fill="#fdf3e3" stroke="#1e5c3a" strokeWidth="1.6" /><circle cx="11" cy="11" r="1.6" fill="#fff" opacity=".85" /><circle cx="19" cy="9.5" r="1.4" fill="#fff" opacity=".85" /></>),
  bread: (<><path d="M5 18 q0 -8 11 -8 t11 8 v3 a2 2 0 0 1 -2 2 H7 a2 2 0 0 1 -2 -2 Z" fill="#eab672" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M10 13 q2 -2 4 0 M18 13 q2 -2 4 0" stroke="#c98b45" strokeWidth="1.6" strokeLinecap="round" /></>),
  cheese: (<><path d="M5 20 L20 8 q6 0 6 5 v7 Z" fill="#ffcf56" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="14" cy="16" r="1.8" fill="#f2b73d" /><circle cx="21" cy="17" r="1.4" fill="#f2b73d" /></>),
  garlic: (<><path d="M16 6 q2 4 6 7 a7.5 7.5 0 1 1 -12 0 q4 -3 6 -7 Z" fill="#faf5ee" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M16 13 v9 M12 16 q1 4 4 6 M20 16 q-1 4 -4 6" stroke="#e3d9cc" strokeWidth="1.4" strokeLinecap="round" /></>),
  leaf: (<><path d="M8 24 Q6 10 24 8 Q22 24 8 24 Z" fill="#6fce8d" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><path d="M10 22 Q16 14 22 10" stroke="#2b8f52" strokeWidth="1.6" strokeLinecap="round" /></>),
  pepper: (<><path d="M10 10 q6 -4 12 0 q2 8 -6 16 q-8 -8 -6 -16 Z" fill="#ff8f6b" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><path d="M16 10 v-4 q3 -1 4 1" stroke="#37a35e" strokeWidth="2" strokeLinecap="round" fill="none" /></>),
  banana: (<><path d="M6 12 q2 12 16 12 q4 -2 2 -5 q-10 2 -14 -8 Z" fill="#ffe15a" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><path d="M6 12 l-1 -3 h4 l1 3" fill="#8a5a2b" /></>),
  potato: (<><ellipse cx="16" cy="17" rx="11" ry="8" fill="#d9b077" stroke="#1e5c3a" strokeWidth="1.6" /><circle cx="11" cy="15" r="1" fill="#a87c41" /><circle cx="19" cy="19" r="1" fill="#a87c41" /><circle cx="21" cy="13" r="1" fill="#a87c41" /></>),
  onion: (<><circle cx="16" cy="18" r="8.5" fill="#f3d3e0" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M16 10 q-4 8 0 16 M16 10 q4 8 0 16" stroke="#ddaecc" strokeWidth="1.4" /><path d="M16 9 l-2 -4 M16 9 l2 -4" stroke="#37a35e" strokeWidth="2" strokeLinecap="round" /></>),
  fish: (<><path d="M6 16 q8 -7 16 0 q-8 7 -16 0 Z" fill="#9ad0ec" stroke="#1e5c3a" strokeWidth="1.6" /><path d="M22 16 l5 -4 v8 Z" fill="#7cc0e4" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="10" cy="15" r="1.2" fill="#1e5c3a" /></>),
  chili: (<><path d="M12 8 q4 0 4 6 q0 8 6 10 q-8 2 -10 -6 q-2 -6 0 -10 Z" fill="#e2493b" stroke="#1e5c3a" strokeWidth="1.6" strokeLinejoin="round" /><path d="M12 8 q-1 -4 3 -4" stroke="#37a35e" strokeWidth="2" strokeLinecap="round" fill="none" /></>),
};

export function FoodIcon({ food, size = 22 }: { food: FoodKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="none" className="food-icon">
      {FOOD_ART[food]}
    </svg>
  );
}

/** Elige un alimento determinista pero "variado" a partir de un texto. */
export function foodFor(name: string): FoodKey {
  const map: [RegExp, FoodKey][] = [
    [/tomate/, 'tomato'], [/aguacate|palta/, 'avocado'], [/huevo/, 'egg'], [/zanahoria/, 'carrot'],
    [/lim[oó]n/, 'lemon'], [/seta|champi/, 'mushroom'], [/pan\b/, 'bread'], [/queso/, 'cheese'],
    [/ajo/, 'garlic'], [/espinaca|lechuga|albahaca|verde/, 'leaf'], [/pimiento|calabac[ií]n|pepino/, 'pepper'],
    [/pl[aá]tano/, 'banana'], [/patata/, 'potato'], [/cebolla/, 'onion'], [/salm[oó]n|at[uú]n|merluza|pescado/, 'fish'],
    [/guindilla|picante|chile|chilli/, 'chili'],
  ];
  const low = name.toLowerCase();
  for (const [re, key] of map) if (re.test(low)) return key;
  let h = 0;
  for (let i = 0; i < low.length; i++) h = (h * 31 + low.charCodeAt(i)) >>> 0;
  const keys = Object.keys(FOOD_ART) as FoodKey[];
  return keys[h % keys.length];
}

/** Hueco pastel claro y rotado para tarjetas de receta — varía por receta. */
export function tileStyle(seed: string): CSSProperties {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const tiles = [SKY, MINT, BLUSH, LILAC, BUTTER];
  return { background: tiles[h % tiles.length], transform: `rotate(${((h >> 3) % 5) - 2}deg)` };
}
