// ─── Página: Ajustes — sección "Aplicación" (instalación, versión, sync) ─────
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { useInstall } from '../hooks/useInstall';
import { platform } from '../platform/capabilities';
import { applyUpdate } from '../platform/pwa';

export default function SettingsPage() {
  const s = useStore();
  const { canNativeInstall, isInstalled, install, outcome } = useInstall();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Escuchar aviso de nueva versión del SW (emitido desde main.tsx)
  useEffect(() => {
    const onUpd = () => setUpdateAvailable(true);
    window.addEventListener('fridgie-update-ready', onUpd);
    return () => window.removeEventListener('fridgie-update-ready', onUpd);
  }, []);

  return (
    <>
      <h1>Ajustes</h1>
      <div className="grid cols-2">
        <Card title="Aplicación">
          <table style={{ width: '100%', fontSize: '.92rem' }}>
            <tbody>
              <tr><td className="muted">Nombre</td><td><b>FRIDGIE</b></td></tr>
              <tr><td className="muted">Versión</td><td>v{__FRIDGIE_VERSION__}</td></tr>
              <tr><td className="muted">Modo actual</td><td>{platform.kind === 'pwa-standalone' ? 'PWA instalada' : platform.kind === 'desktop-tauri' ? 'Escritorio (Tauri)' : 'Web en navegador'}</td></tr>
              <tr><td className="muted">Nube</td><td>{s.cloudMode === 'supabase' ? 'Supabase (cuenta y datos compartidos entre dispositivos)' : 'Demo local (sin cuenta) — configura Supabase para sincronizar entre dispositivos'}</td></tr>
            </tbody>
          </table>
          <div className="row" style={{ marginTop: '1rem' }}>
            {isInstalled ? (
              <span className="pill pill-green">✔ FRIDGIE ya está instalada</span>
            ) : (
              <button className="btn btn-primary" onClick={install}>⬇ Instalar FRIDGIE</button>
            )}
            {!isInstalled && !canNativeInstall && (
              <span className="muted" style={{ maxWidth: 380 }}>
                {outcome?.instructions ?? 'Si tu navegador no muestra el diálogo, usa su menú («Instalar aplicación» / «Añadir a pantalla de inicio»). La disponibilidad depende del sistema operativo y del navegador.'}
              </span>
            )}
          </div>
          {updateAvailable && (
            <div className="row" style={{ marginTop: '.8rem' }}>
              <span className="pill pill-amber">Hay una nueva versión disponible</span>
              <button className="btn btn-secondary" onClick={() => applyUpdate()}>Actualizar ahora</button>
            </div>
          )}
          <p className="muted" style={{ marginTop: '.8rem' }}>
            ¿Buscas más opciones? Mira la página <Link to="/download">Descargar FRIDGIE</Link>.
          </p>
        </Card>

        <Card title="Sincronización">
          <div className="row spread">
            <span className={`pill ${s.online ? 'pill-green' : 'pill-amber'}`}>{s.online ? 'Conectado' : 'Sin conexión'}</span>
            <span className="muted">
              Pendientes: {s.sync.pendingCount} · Última sync: {s.sync.lastSyncAt ? new Date(s.sync.lastSyncAt).toLocaleString() : 'nunca'}
            </span>
          </div>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <button className="btn btn-secondary" onClick={() => s.syncNow()} disabled={!s.online || s.sync.syncing}>
              {s.sync.syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
            {s.sync.error && <span className="pill pill-red">{s.sync.error}</span>}
          </div>
          <p className="muted">
            Al recuperar la conexión, los cambios guardados offline se envían automáticamente.
            Si el mismo dato cambió en dos dispositivos, FRIDGIE te pedirá qué versión conservar — nunca sobrescribe en silencio.
          </p>
        </Card>

        <Card title="Preferencias">
          <div className="row">
            <label className="muted">Unidades</label>
            <select
              style={{ width: 160 }}
              value={s.prefs.units}
              onChange={(e) => s.savePrefs({ ...s.prefs, units: e.target.value as 'metric' | 'imperial', updatedAt: Date.now(), syncStatus: 'pending' })}
            >
              <option value="metric">Métricas (g, ml)</option>
              <option value="imperial">Imperiales (oz)</option>
            </select>
          </div>
        </Card>

        <Card title="Cuenta">
          {s.session ? (
            <p>Sesión activa: <b>{s.session.email}</b> ({s.session.provider}). Las mismas listas, recetas y despensa están disponibles en cualquier dispositivo donde inicies sesión.</p>
          ) : (
            <p className="muted">
              No has iniciado sesión. En modo demo tus datos viven solo en este dispositivo; instalar la PWA <b>no crea otra cuenta ni otra biblioteca</b>: es la misma app y los mismos datos locales.
              Con Supabase configurado, inicia sesión para sincronizar entre dispositivos. El inicio de sesión requiere conexión.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
