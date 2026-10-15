// ─── Service worker de FRIDGIE (Workbox — ecosistema oficial) ────────────────
// Compilado con esbuild + workbox-build (generateSW) en `npm run build`.
// Estrategias:
//   • Navegación offline: navigateFallback → /index.html cacheado (shell real).
//   • Assets con hash: precache (self.__WB_MANIFEST, inyectado por la build).
//   • Manifest e iconos: StaleWhileRevalidate.
//   • Supabase/API/IA: NetworkOnly (nunca cachear datos privados ni fingir respuestas).
// Actualizaciones: el nuevo SW queda en "waiting" hasta que la app envía
// SKIP_WAITING y el usuario confirma ("Actualizar ahora" en Ajustes).

declare const self: ServiceWorkerGlobalScope & {
  /** Lista de precache inyectada por workbox-build en tiempo de compilación. */
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache de assets reales de dist/ (la build reemplaza __WB_MANIFEST)
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

// Manifest + iconos: servir de caché y revalidar en segundo plano
registerRoute(
  ({ url }) => /\/(manifest\.webmanifest|icons\/.*\.png)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'pwa-resources',
    plugins: [new ExpirationPlugin({ maxEntries: 40 })],
  }),
);

// API externa (Supabase, IA): SOLO red. Sin caché → sin datos inventados.
registerRoute(
  ({ url }) =>
    url.hostname.endsWith('.supabase.co') ||
    url.pathname.startsWith('/api/') ||
    /generativelanguage|openai/.test(url.hostname),
  new NetworkOnly(),
);

// La app pide aplicar actualización cuando el usuario confirma.
// IMPORTANTE: no hacemos skipWaiting() automático en "install" para que exista
// una ventana real de "actualización disponible" controlada por el usuario.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
