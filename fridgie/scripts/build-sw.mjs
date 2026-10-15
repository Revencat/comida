// ─── Build del service worker con Workbox (ecosistema oficial de Vite/GA) ────
// Se ejecuta como post-build (`npm run build` → `node scripts/build-sw.mjs`).
// Genera dist/sw.js a partir de src/sw.ts compilando con esbuild e inyectando
// la lista de precache real de los assets de dist/ (workbox-build).

import { build } from 'esbuild';
import { generateSW } from 'workbox-build';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const DIST = 'dist';

// 1) Compilar src/sw.ts → ESM temporal
const tmp = mkdtempSync(join(tmpdir(), 'fridgie-sw-'));
const tmpSw = join(tmp, 'sw.mjs');
await build({
  entryPoints: ['src/sw.ts'],
  bundle: true,
  format: 'esm',
  outfile: tmpSw,
  target: 'es2022',
  platform: 'browser',
  define: { 'self.__WB_MANIFEST': '[]' },
});

// 2) workbox-build genera dist/sw.js + dist/workbox-*.js con el precache real
const swSource = readFileSync(tmpSw, 'utf8');
const result = await generateSW({
  swDest: `${DIST}/sw.js`,
  globDirectory: DIST,
  globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
  mode: 'production',
  navigateFallback: '/index.html',
  runtimeCaching: [
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api'),
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /.*\.supabase\.co.*/,
      handler: 'NetworkOnly',
    },
  ],
});

// 3) Reemplazar el sw generado por nuestro sw compilado manteniendo el manifest
//    de precache que workbox-build escribió en sw.js: lo extraemos y lo inyectamos.
const generated = readFileSync(`${DIST}/sw.js`, 'utf8');
const m = generated.match(/self\.__WB_MANIFEST\s*=\s*(\[[\s\S]*?\]);/);
if (!m) throw new Error('No se pudo extraer __WB_MANIFEST del SW generado.');
const finalSw = swSource.replace('self.__WB_MANIFEST', `(${m[1]})`);
writeFileSync(`${DIST}/sw.js`, finalSw);

rmSync(tmp, { recursive: true, force: true });
console.log(`✔ Service worker generado: dist/sw.js (${result.count} entradas de precache)`);
