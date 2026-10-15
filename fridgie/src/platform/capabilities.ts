// ─── Capa de abstracción de plataforma: web/PWA vs escritorio (Tauri) ──────
// El core NUNCA llama a window./navigator. directamente: usa PlatformCapabilities.
// Así, empaquetar con Tauri no requiere reescribir lógica.

export type PlatformKind = 'web' | 'pwa-standalone' | 'desktop-tauri';

export interface InstallOutcome {
  status: 'accepted' | 'dismissed' | 'unsupported';
  instructions?: string;   // guía cuando no hay prompt nativo
}

export interface PlatformCapabilities {
  kind: PlatformKind;
  /** ¿Puede instalarse mediante prompt nativo del navegador? */
  canNativeInstall: boolean;
  /** ¿La app ya está instalada (standalone / escritorio)? */
  isInstalled: boolean;
  requestInstall(): Promise<InstallOutcome>;
  onInstallable(cb: (ok: boolean) => void): () => void;
  /** Notificación al usuario (canal unificado). */
  notify(message: string): void;
  /** Almacenamiento clave-valor persistente (alternativa a IndexedDB para datos simples). */
  kvGet(key: string): Promise<string | null>;
  kvSet(key: string, value: string): Promise<void>;
}

const isStandalone =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
   // iOS Safari
   (navigator as unknown as { standalone?: boolean }).standalone === true);

export const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// ─── Implementación web/PWA ────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installableListeners = new Set<(ok: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installableListeners.forEach((cb) => cb(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installableListeners.forEach((cb) => cb(false));
  });
}

function platformInstructions(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'En iPhone/iPad (Safari): toca Compartir y después «Añadir a pantalla de inicio».';
  }
  if (/Android/.test(ua)) {
    return 'En Android (Chrome): menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».';
  }
  if (/Edg/.test(ua)) {
    return 'En Edge: icono de instalación en la barra de direcciones o menú ⋯ → «Apps» → «Instalar este sitio como aplicación».';
  }
  return 'En Chrome/Edge de escritorio: menú ⋮ → «Instalar FRIDGIE como aplicación». En Firefox/Safari sin opción automática, añade la página a marcadores o pantalla de inicio según tu sistema.';
}

export const webPlatform: PlatformCapabilities = {
  kind: isStandalone ? 'pwa-standalone' : 'web',
  get canNativeInstall() { return deferredPrompt !== null; },
  isInstalled: isStandalone,
  async requestInstall(): Promise<InstallOutcome> {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return { status: outcome };
    }
    if (isStandalone) return { status: 'accepted' };
    return { status: 'unsupported', instructions: platformInstructions() };
  },
  onInstallable(cb) {
    installableListeners.add(cb);
    cb(deferredPrompt !== null);
    return () => installableListeners.delete(cb);
  },
  notify(message) {
    window.dispatchEvent(new CustomEvent('fridgie-toast', { detail: message }));
  },
  async kvGet(key) { return localStorage.getItem(key); },
  async kvSet(key, value) { localStorage.setItem(key, value); },
};

// ─── Implementación escritorio (Tauri) — se activa solo dentro del bundle ──
export const tauriPlatform: PlatformCapabilities = {
  kind: 'desktop-tauri',
  canNativeInstall: false,          // el instalador es el propio paquete .msi/.dmg/.AppImage
  isInstalled: true,
  async requestInstall() {
    return {
      status: 'unsupported',
      instructions: 'Ya estás usando la aplicación de escritorio FRIDGIE. Las actualizaciones llegan con una nueva versión del instalador.',
    };
  },
  onInstallable(cb) { cb(false); return () => {}; },
  notify(message) { window.dispatchEvent(new CustomEvent('fridgie-toast', { detail: message })); },
  // En Tauri persistimos además en disco vía plugin fs SOLO si el usuario lo pide
  // (permisos mínimos — ver src-tauri/capabilities). Para datos simples usamos IndexedDB del WebView.
  async kvGet(key) { return localStorage.getItem(key); },
  async kvSet(key, value) { localStorage.setItem(key, value); },
};

export const platform: PlatformCapabilities = isTauri ? tauriPlatform : webPlatform;
