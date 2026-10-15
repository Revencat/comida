// ─── Build del service worker de FRIDGIE (Workbox oficial) ──────────────────
// Se ejecuta como post-build (`npm run build` → `node scripts/build-sw.mjs`).
// 1) esbuild compila src/sw.ts a un ESM temporal con workbox embebido.
// 2) workbox-build genera el manifest de precache REAL de los assets de dist/.
// 3) Inyectamos ese manifest en nuestro SW y escribimos dist/sw.js.

import { build } from 'esbuild';
import { getManifest } from 'workbox-build';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const DIST = 'dist';

// 1) Compilar src/sw.ts → ESM temporal (workbox-* queda incluido en el bundle)
const tmp = mkdtempSync(join(tmpdir(), 'fridgie-sw-'));
const tmpSw = join(tmp, 'sw.mjs');
await build({
  entryPoints: ['src/sw.ts'],
  bundle: true,
  format: 'esm',
  outfile: tmpSw,
  target: 'es2022',
  platform: 'browser',
});

// 2) Manifest de precache real de dist/ (getManifest no escribe ningún archivo)
const { count, manifestEntries } = await getManifest({
  globDirectory: DIST,
  globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
});

// self.__WB_MANIFEST a partir de los archivos REALES de dist/ (revision = md5)
const entries = manifestEntries.map((e) => ({ url: e.url, revision: e.revision ?? null }));
const manifestLiteral = JSON.stringify(entries);

// 3) Inyectar el manifest en nuestro SW compilado y escribir dist/sw.js
let swSource = readFileSync(tmpSw, 'utf8');
if (!swSource.includes('self.__WB_MANIFEST')) {
  throw new Error('No se encontró self.__WB_MANIFEST en el SW compilado.');
}
swSource = swSource.replace(/self\.__WB_MANIFEST/g, manifestLiteral);
writeFileSync(`${DIST}/sw.js`, swSource);

rmSync(tmp, { recursive: true, force: true });
console.log(`✔ Service worker generado: dist/sw.js (${entries.length}/${count} entradas de precache)`);
