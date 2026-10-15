// ─── PWA: registro del service worker + actualizaciones + instalación ───────
import { Workbox, messageSW } from 'workbox-window';
import { platform } from './capabilities';

export const SW_URL = '/sw.js';

let wb: Workbox | null = null;

/** Registra el SW y gestiona el ciclo de vida de las actualizaciones. */
export function registerServiceWorker(onUpdateReady: (sw: ServiceWorker) => void): void {
  if (!('serviceWorker' in navigator) || import.meta.env.MODE === 'test') return;
  wb = new Workbox(SW_URL, { type: 'module' });

  wb.onNeedSWUpdate(() => {
    const waiting = wb?.sw?.state === 'installed' ? wb.sw : undefined;
    if (waiting) onUpdateReady(waiting as ServiceWorker);
    else wb?.skipWaiting();
  });

  wb.register().catch((err) =>
    console.warn('[FRIDGIE] No se pudo registrar el service worker:', err),
  );
}

/** Aplica la actualización: el nuevo SW toma el control y la página se recarga. */
export async function applyUpdate(): Promise<void> {
  if (!wb) return;
  await messageSW(wb.sw as ServiceWorker, { type: 'SKIP_WAITING' });
  window.location.reload();
}

/** ¿El navegador soporta algún mecanismo de instalación? (honesto por diseño) */
export function supportsAnyInstall(): boolean {
  return platform.canNativeInstall || platform.isInstalled ||
    /iPhone|iPad|iPod|Android|Edg|Chrome/.test(navigator.userAgent);
}
