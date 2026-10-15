// ─── PWA: registro del service worker + actualizaciones + instalación ───────
import { Workbox } from 'workbox-window';
import type { WorkboxLifecycleEvent } from 'workbox-window';
import { platform } from './capabilities';

export const SW_URL = '/sw.js';

let wb: Workbox | null = null;

/** Registra el SW y gestiona el ciclo de vida de las actualizaciones. */
export function registerServiceWorker(onUpdateReady: (sw: ServiceWorker) => void): void {
  if (!('serviceWorker' in navigator) || import.meta.env.MODE === 'test') return;
  wb = new Workbox(SW_URL);

  // API de workbox-window v7: cuando un nuevo SW termina de instalarse como
  // actualización, queda en "waiting"; avisamos a la UI para ofrecer "Actualizar ahora".
  wb.addEventListener('installed', (event) => {
    const e = event as WorkboxLifecycleEvent;
    if (e.isUpdate && e.sw) onUpdateReady(e.sw);
  });

  wb.register().catch((err) =>
    console.warn('[FRIDGIE] No se pudo registrar el service worker:', err),
  );
}

/** Aplica la actualización: el nuevo SW toma el control y la página se recarga. */
export async function applyUpdate(): Promise<void> {
  if (!wb) return;
  wb.messageSkipWaiting(); // envía SKIP_WAITING al SW en estado "waiting"
  window.location.reload();
}

/** ¿El navegador soporta algún mecanismo de instalación? (honesto por diseño) */
export function supportsAnyInstall(): boolean {
  return platform.canNativeInstall || platform.isInstalled ||
    /iPhone|iPad|iPod|Android|Edg|Chrome/.test(navigator.userAgent);
}
