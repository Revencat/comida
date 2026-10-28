// ─── Componentes compartidos de UI ─────────────────────────────────────────
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import { platform } from '../platform/capabilities';

export { Broc } from '../brand/broc';

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout((onToast as unknown as { t?: number }).t);
      (onToast as unknown as { t?: number }).t = window.setTimeout(() => setMsg(null), 4200);
    };
    window.addEventListener('fridgie-toast', onToast);
    return () => window.removeEventListener('fridgie-toast', onToast);
  }, []);
  if (!msg) return null;
  return <div className="toast" role="status">{msg}</div>;
}

export function StatusBanners() {
  const { online, sync } = useStore();
  return (
    <>
      {!online && (
        <div className="offline-banner" role="status">
          <span aria-hidden>📶</span>
          Sin conexión — puedes consultar recetas guardadas, tu despensa sincronizada y editar tus listas.
          Los cambios se guardan localmente y se sincronizarán automáticamente al volver la conexión.
          La IA y el inicio de sesión no están disponibles ahora.
        </div>
      )}
      {online && sync.pendingCount > 0 && (
        <div className="offline-banner sync-banner" role="status">
          {sync.syncing ? 'Sincronizando…' : `${sync.pendingCount} cambio(s) pendientes de sincronizar.`}
        </div>
      )}
      {online && sync.conflicts.length > 0 && (
        <ConflictList />
      )}
    </>
  );
}

function ConflictList() {
  const { sync, resolveConflict } = useStore();
  return (
    <div className="offline-banner" style={{ flexDirection: 'column', alignItems: 'stretch' }} role="alert">
      <strong>Conflicto de sincronización — necesitamos tu decisión</strong>
      <p className="muted" style={{ margin: '.3rem 0' }}>
        El mismo dato se modificó en dos dispositivos. FRIDGIE nunca sobrescribe en silencio.
      </p>
      {sync.conflicts.map((c) => (
        <div key={c.entityId} className="row spread" style={{ background: '#fff', borderRadius: 12, padding: '.5rem .8rem' }}>
          <span><b>{c.label}</b> <span className="pill pill-gray">{c.entity}</span></span>
          <span className="row">
            <button className="btn btn-secondary" onClick={() => resolveConflict(c, 'local')}>Mantener el mío</button>
            <button className="btn btn-ghost" onClick={() => resolveConflict(c, 'remote')}>Usar el de la nube</button>
          </span>
        </div>
      ))}
    </div>
  );
}

const NAV = [
  { to: '/', label: 'Inicio', icon: IconHome },
  { to: '/recipes', label: 'Recetas', icon: IconRecipe },
  { to: '/pantry', label: 'Despensa', icon: IconPantry },
  { to: '/lists', label: 'Listas', icon: IconList },
  { to: '/scan', label: 'Escanear', icon: IconScan },
  { to: '/download', label: 'Descargar', icon: IconDownload },
  { to: '/settings', label: 'Ajustes', icon: IconGear },
];

export function Layout() {
  const { online } = useStore();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand"><img src="/icons/icon-192.png" alt="" width={34} height={34} /> Fridgie</NavLink>
          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>{n.label}</NavLink>)}
          </nav>
          <span className={`pill ${online ? 'pill-green' : 'pill-amber'}`} title={online ? 'Conectado' : 'Sin conexión'}>
            {online ? '● En línea' : '○ Offline'}
          </span>
        </div>
      </header>
      <main className="main">
        <StatusBanners />
        <Outlet />
      </main>
      <footer className="footer-links">FRIDGIE v{__FRIDGIE_VERSION__} · hecha con 💚 para cocinas reales</footer>
      <nav className="tabbar" aria-label="Navegación móvil">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <n.icon /><span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <ToastHost />
    </div>
  );
}

// Iconos de navegación (SVG inline, stroke actual)
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
function IconHome() { return <svg {...base}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>; }
function IconRecipe() { return <svg {...base}><path d="M4 5a2 2 0 012-2h13v18H6a2 2 0 01-2-2Z" /><path d="M8 7h7M8 11h7" /></svg>; }
function IconPantry() { return <svg {...base}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 12h16M15 7v2M15 15v2" /></svg>; }
function IconList() { return <svg {...base}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /></svg>; }
function IconDownload() { return <svg {...base}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></svg>; }
function IconScan() { return <svg {...base}><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" /><path d="M4 12h16" /></svg>; }
function IconGear() { return <svg {...base}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></svg>; }

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  return <section className="card">{title && <h2 style={{ marginTop: 0 }}>{title}</h2>}{children}</section>;
}

export { platform };
