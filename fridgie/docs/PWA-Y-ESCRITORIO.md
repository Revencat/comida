# FRIDGIE — PWA, instalación y empaquetado de escritorio

## 1. Ejecutar y publicar (web + PWA)

```bash
cd fridgie
npm install
npm run dev        # desarrollo (http://localhost:5173)
npm run build      # producción → dist/ (incluye service worker generado)
npm run preview    # sirve la build como si estuviera publicada
```

**Vercel:** el repo incluye `fridgie/vercel.json` (build `npm run build`, salida `dist`).
En el proyecto de Vercel, configura **Root Directory = `fridgie`**. La PWA requiere HTTPS
(Vercel lo aporta) para que el service worker y la instalación funcionen.

## 2. Instalación ("Instalar FRIDGIE")

- Chrome/Edge/Escritorio y Chrome Android: se usa el evento nativo `beforeinstallprompt`
  (botón real del navegador). Si el usuario ya instaló (`display-mode: standalone`),
  la interfaz deja de ofrecer la instalación.
- iOS Safari: sin API nativa → se muestran instrucciones para "Añadir a pantalla de inicio".
- Firefox Android: instrucciones desde el menú.
- Nunca se simula una instalación abriendo otra pestaña.

## 3. Modo offline

Estrategias del SW (`src/sw.ts`, generado en `dist/sw.js`):
- Navegación: NetworkFirst con fallback a la shell cacheada (`index.html`).
- Assets con hash: precache (CacheFirst implícito).
- Manifest/iconos: StaleWhileRevalidate.
- Supabase/API/IA: **NetworkOnly** (nunca se inventan respuestas sin conexión).

Datos locales en IndexedDB (`src/core/storage.ts`) con cola de cambios pendientes;
al recuperar conexión se sincroniza (`src/services/sync.ts`) con resolución explícita
de conflictos (last-write-win por campo + aviso al usuario si hay colisión real).

Funciones NO disponibles offline: generación con IA, autenticación online,
sincronización forzada. La UI lo indica claramente.

## 4. Iconos

Los PNG de `public/icons/` (32–512 + apple-touch-icon 180) se generan con:

```bash
pip install pillow
npm run build:icons   # node scripts/generate-icons.mjs
```

Están commiteados: el build de CI/Vercel no necesita Python.
El diseño es el símbolo propio "arco de nevera" de FRIDGIE (no un emoji).

## 5. Empaquetado de escritorio (Tauri, progresivo)

El frontend ya está preparado: enrutado HashRouter (compatible `file://`), sin APIs
exclusivas de navegador fuera de `src/platform/`. Carpeta `src-tauri/` reservada.

Cuando se decida generar instaladores reales:

```bash
npm install -D @tauri-apps/cli
npx tauri init                 # frontendDist: ../dist, beforeBuildCommand: npm run build
npx tauri build                # genera paquetes POR PLATAFORMA:
#  Windows → .msi/.exe   (compilar en Windows)
#  macOS   → .dmg/.app   (compilar en macOS; notarización para distribuir)
#  Linux   → .deb/.rpm/AppImage (NO un único instalador universal)
```

Permisos: solo los necesarios (fs/scoped, notification) declarados en
`src-tauri/capabilities`; nunca acceso indiscriminado al sistema de archivos.
Las claves privadas del backend jamás se empaquetan: Supabase usa anon key + RLS,
y las claves secretas quedan solo en el servidor/edge functions.

**Estado honesto:** en esta entrega no existe ningún instalador compilado.
La página "Descargar FRIDGIE" muestra "Versión de escritorio próximamente" hasta
que los binarios se generen y publiquen realmente.

## 6. Comprobaciones realizadas (automatizadas en local)

- ✔ `npm run build` completo (tsc + vite + SW) sin errores.
- ✔ Manifest JSON válido; los 11 iconos declarados existen en `public/icons/`.
- ✔ `dist/sw.js` contiene el precache real (17 entradas) y las rutas de caché.
- ✔ `vite preview`: `/`, `/sw.js`, `/manifest.webmanifest` e iconos responden 200.
- ✔ `__FRIDGIE_VERSION__` sustituido por la versión de `package.json` en el bundle.
- Pendiente de ejecución manual en dispositivo real: prompt nativo de instalación,
  corte de red y sincronización (requiere navegador con perfil de usuario).
