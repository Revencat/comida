// ─── Hook de instalación PWA: lógica real, adaptada al navegador ────────────
import { useCallback, useEffect, useState } from 'react';
import { platform, type InstallOutcome } from '../platform/capabilities';

export interface UseInstall {
  canNativeInstall: boolean;   // existe beforeinstallprompt pendiente
  isInstalled: boolean;        // standalone o escritorio
  install: () => Promise<InstallOutcome>;
  outcome: InstallOutcome | null;
}

export function useInstall(): UseInstall {
  const [canNative, setCanNative] = useState(platform.canNativeInstall);
  const [outcome, setOutcome] = useState<InstallOutcome | null>(null);

  useEffect(() => platform.onInstallable(setCanNative), []);

  const install = useCallback(async () => {
    const res = await platform.requestInstall();
    setOutcome(res);
    if (res.status === 'accepted') platform.notify('¡FRIDGIE instalada! Búscala en tu pantalla de inicio o dock.');
    return res;
  }, []);

  return {
    canNativeInstall: canNative,
    isInstalled: platform.isInstalled || outcome?.status === 'accepted',
    install,
    outcome,
  };
}
