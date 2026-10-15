// ─── Service worker de FRIDGIE (construido con Workbox — ecosistema oficial) ─
// Estrategias:
//   • App shell (HTML de navegación): NetworkFirst con fallback offline a /index.html
//     → tras la primera visita, la estructura principal abre SIN conexión.
//   • Assets inmutables (JS/CSS con hash): CacheFirst + expire (precaching de build).
//   • Manifest e iconos: StaleWhileRevalidate.
//   • Supabase/API: NetworkOnly (nunca cachear datos privados ni fingir respuestas).
// Actualizaciones: el nuevo SW queda en "waiting" hasta que el usuario pulse
// "Actualizar ahora" (SKIP_WAITING por mensaje desde la app).

importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.3.1/workbox-sw.js',
);

if (self.workbox) {
  const { routing, strategies, core, expiration, precaching } = workbox;

  core.setCacheNamePrefix('fridgie-');

  // Precache de assets de la build (lista generada por workbox-build en npm run build)
  try {
    importScripts('./sw-precache-manifest.js');
  } catch { /* preview sin manifest */ }

  // Navegación: network-first, fallback a la shell cacheada (modo offline real)
  routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new strategies.NetworkFirst({
      cacheName: 'app-shell',
      networkTimeoutSeconds: 4,
      plugins: [
        new strategies.PluginCacheableResponse({ statuses: [0, 200] }),
        {
          handlerDidError: async () => caches.match('/index.html', { cacheName: 'app-shell' }),
        },
      ],
    }),
  );

  // El propio index se guarda en caché al primer acceso online
  routing.registerRoute(
    ({ url, request }) => request.destination === 'document',
    new strategies.StaleWhileRevalidate({ cacheName: 'app-shell' }),
  );

  // JS/CSS con hash → CacheFirst con caducidad
  routing.registerRoute(
    ({ request }) => ['script', 'style'].includes(request.destination),
    new strategies.CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new expiration.ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 3600 }),
        new core.CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  );

  // Manifest + iconos
  routing.registerRoute(
    ({ url }) => /\/(manifest\.webmanifest|icons\/.*\.png)$/.test(url.pathname),
    new strategies.StaleWhileRevalidate({
      cacheName: 'pwa-resources',
      plugins: [new expiration.ExpirationPlugin({ maxEntries: 40 })],
    }),
  );

  // API externa (Supabase, IA): SOLO red. Sin caché → sin datos inventados.
  routing.registerRoute(
    ({ url }) =>
      url.hostname.endsWith('.supabase.co') ||
      url.pathname.startsWith('/api/') ||
      /generativelanguage|openai/.test(url.hostname),
    new strategies.NetworkOnly(),
  );

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (e) => {
    e.waitUntil(core.clientsClaim().then(() => clients.matchAll({ type: 'window' })));
  });

  // La app pide aplicar actualización cuando el usuario confirma
  self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  });
} else {
  // Fallback mínimo si el CDN de Workbox no está disponible (entornos restringidos):
  // aún así ofrece shell offline honesto.
  const SHELL = '/index.html';
  self.addEventListener('install', (e) => {
    e.waitUntil(caches.open('app-shell').then((c) => c.add(SHELL)).then(() => self.skipWaiting()));
  });
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener('fetch', (e) => {
    if (e.request.mode === 'navigate') {
      e.respondWith(
        fetch(e.request).catch(() => caches.match(SHELL)),
      );
    }
  });
}
