// ─── Marca: Broc (mascota) e iconos de alimentos ───────────────────────────
import type { ReactNode } from 'react';

export type BrocVariant = 'default' | 'happy' | 'cart' | 'chef';

export function Broc({ size = 44, variant = 'default', title = 'Broc, la mascota de Fridgie' }:
  { size?: number; variant?: BrocVariant; title?: string }) {
  const chef = variant === 'chef';
  return (
    <svg className="broc" width={size} height={size} viewBox={chef ? '0 -30 200 230' : '0 0 200 200'} role="img" aria-label={title}>
      

  <ellipse cx="100" cy="190" rx="42" ry="5" fill="#1F5130" opacity="0.12"/>

  <g fill="#1F5130" stroke="#1F5130" strokeWidth="10" strokeLinejoin="round">
    <rect x="74" y="112" width="52" height="68" rx="22"/>
    <circle cx="52" cy="92" r="28"/>
    <circle cx="78" cy="60" r="32"/>
    <circle cx="122" cy="58" r="34"/>
    <circle cx="150" cy="90" r="28"/>
    <circle cx="100" cy="88" r="42"/>
  </g>

  <rect x="74" y="112" width="52" height="68" rx="22" fill="#B7DB7A"/>
  <path d="M89 150v13M111 150v13" stroke="#8FBF4F" strokeWidth="4" strokeLinecap="round" fill="none"/>

  <g fill="#3FA34D">
    <circle cx="52" cy="92" r="28"/>
    <circle cx="78" cy="60" r="32"/>
    <circle cx="122" cy="58" r="34"/>
    <circle cx="150" cy="90" r="28"/>
    <circle cx="100" cy="88" r="42"/>
  </g>

  <g fill="#8FD16E" opacity="0.85">
    <circle cx="66" cy="46" r="7"/>
    <circle cx="110" cy="40" r="8"/>
    <circle cx="38" cy="82" r="6"/>
    <circle cx="150" cy="76" r="6"/>
  </g>

  <g>
    <circle cx="82" cy="96" r="12" fill="#FFFFFF" stroke="#1F5130" strokeWidth="3"/>
    <circle cx="118" cy="96" r="12" fill="#FFFFFF" stroke="#1F5130" strokeWidth="3"/>
    <circle cx="85" cy="98" r="6.5" fill="#1D2B20"/>
    <circle cx="121" cy="98" r="6.5" fill="#1D2B20"/>
    <circle cx="87.5" cy="95.5" r="2.4" fill="#FFFFFF"/>
    <circle cx="123.5" cy="95.5" r="2.4" fill="#FFFFFF"/>
  </g>

  <ellipse cx="68" cy="111" rx="7" ry="5" fill="#FF8FA3" opacity="0.75"/>
  <ellipse cx="132" cy="111" rx="7" ry="5" fill="#FF8FA3" opacity="0.75"/>
  {variant === 'happy' ? (<path d="M86 111Q100 136 114 111Z" fill="#1F5130" stroke="#1F5130" strokeWidth="3" strokeLinejoin="round"/>) : (<path d="M89 113Q100 125 111 113" fill="none" stroke="#1F5130" strokeWidth="4.5" strokeLinecap="round"/>)}

      {chef && (
        <g fill="#fff" stroke="#1F5130" strokeWidth="3.5" strokeLinejoin="round">
          <circle cx="80" cy="6" r="18" /><circle cx="100" cy="0" r="20" /><circle cx="120" cy="6" r="18" />
          <rect x="74" y="14" width="52" height="18" rx="6" />
        </g>
      )}
      {variant === 'cart' && (
        <g transform="rotate(8 157 147)">
          <rect x="138" y="120" width="38" height="54" rx="6" fill="#fff" stroke="#1F5130" strokeWidth="4" />
          <path d="M146 134h22M146 144h22M146 154h14" stroke="#8FBF4F" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// ─── Alimentos ──────────────────────────────────────────────────────────────
export type Food = 'fruit' | 'veg' | 'meat' | 'fish' | 'dairy' | 'bread' | 'drink' | 'other';

const RULES: [Food, RegExp][] = [
  ['fish', /(pescado|merluza|salm[oó]n|at[uú]n|bacalao|gamba|langostino|calamar|sardina|pulpo|marisco)/],
  ['meat', /(pollo|pavo|ternera|cerdo|jam[oó]n|chorizo|salchicha|carne|lomo|bacon|hamburguesa|cordero)/],
  ['dairy', /(leche|yogur|queso|mantequilla|nata|huevo|reques[oó]n)/],
  ['bread', /(pan|barra|baguette|tostada|galleta|cereal|pasta|arroz|harina|bollo)/],
  ['drink', /(agua|zumo|refresco|cerveza|vino|caf[eé]|t[eé]|cola|bebida)/],
  ['fruit', /(manzana|pl[aá]tano|banana|naranja|lim[oó]n|fresa|uva|pera|melocot[oó]n|sand[ií]a|mel[oó]n|kiwi|mandarina|fruta)/],
  ['veg', /(tomate|lechuga|cebolla|zanahoria|patata|pimiento|br[oó]coli|calabac[ií]n|ajo|pepino|espinaca|champi|verdura|ensalada|judia|jud[ií]a)/],
];

export function foodFor(name: string): Food {
  const n = name.toLowerCase();
  for (const [food, re] of RULES) if (re.test(n)) return food;
  return 'other';
}

const TILE: Record<Food, { bg: string; glyph: ReactNode }> = {
  fruit: { bg: '#ffe0e0', glyph: <><circle cx="12" cy="14" r="6.5" fill="#e5484d" /><path d="M12 8c0-2 1-3 3-3" stroke="#1f6b3b" strokeWidth="2" strokeLinecap="round" fill="none" /></> },
  veg: { bg: '#e6f6d8', glyph: <><path d="M6 8h12l-6 13Z" fill="#f08a24" /><path d="M9 8c0-3 1-4 3-4s3 1 3 4" stroke="#3fa34d" strokeWidth="2" fill="none" strokeLinecap="round" /></> },
  meat: { bg: '#fde8d8', glyph: <><ellipse cx="10" cy="11" rx="6" ry="5" fill="#b8643c" /><rect x="13" y="13" width="7" height="3.5" rx="1.7" fill="#f6e7d4" transform="rotate(35 16 15)" /></> },
  fish: { bg: '#dff0fb', glyph: <><ellipse cx="11" cy="12" rx="7" ry="4.5" fill="#4a9bd6" /><path d="M17 12l4-4v8Z" fill="#4a9bd6" /><circle cx="8" cy="11" r="1" fill="#fff" /></> },
  dairy: { bg: '#fff3c4', glyph: <><path d="M7 8l2-4h6l2 4v12H7Z" fill="#fff" stroke="#1f6b3b" strokeWidth="1.6" strokeLinejoin="round" /><rect x="7" y="12" width="10" height="4" fill="#7ec8f0" /></> },
  bread: { bg: '#fdebc8', glyph: <><rect x="4" y="9" width="16" height="10" rx="5" fill="#d99a4e" /><path d="M9 11v3M13 11v3" stroke="#f6d9a8" strokeWidth="1.6" strokeLinecap="round" /></> },
  drink: { bg: '#e8e3fb', glyph: <><path d="M8 5h8l-1 15H9Z" fill="#8b7fe0" /><path d="M10 3l4 0" stroke="#1f6b3b" strokeWidth="2" strokeLinecap="round" /></> },
  other: { bg: '#f0e3b8', glyph: <><path d="M5 9h14l-1.2 11H6.2Z" fill="#c9a94e" /><path d="M9 9a3 3 0 016 0" stroke="#8a6d1f" strokeWidth="1.8" fill="none" /></> },
};

export function FoodIcon({ food, size = 24 }: { food: Food; size?: number }) {
  const t = TILE[food];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="7" fill={t.bg} />
      {t.glyph}
    </svg>
  );
}
