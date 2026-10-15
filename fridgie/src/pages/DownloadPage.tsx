// ─── Página: Descargar FRIDGIE (web · PWA · escritorio futuro) ──────────────
// Honestidad por diseño: ningún botón apunta a un archivo inexistente.
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { BrocScene, FoodIcon } from '../brand/broc';
import { useInstall } from '../hooks/useInstall';
import { platform } from '../platform/capabilities';

const VERSION = __FRIDGIE_VERSION__;

export default function DownloadPage() {
  const { canNativeInstall, isInstalled, install, outcome } = useInstall();

  return (
    <>
      <div className="hero">
        <BrocScene />
        <h1>FRIDGIE, donde la necesites</h1>
        <p className="tagline">Tu cocina, siempre a mano.</p>
        <p className="subtitle" style={{ maxWidth: 560, margin: '0 auto' }}>
          Organiza tu despensa, descubre recetas y gestiona tu compra desde tus dispositivos favoritos.
        </p>
      </div>

      <div className="dl-grid">
        {/* Web */}
        <Card className="tilt-a">
          <div className="platform-card">
            <b>Versión web</b>
            <p className="muted" style={{ margin: 0 }}>Sin instalación. Todas las funciones principales en tu navegador, en ordenador, tablet y móvil.</p>
            <div className="foot"><Link to="/" className="btn btn-secondary">Abrir FRIDGIE en el navegador</Link></div>
          </div>
        </Card>

        {/* PWA */}
        <Card className="tilt-b featured">
          <div className="platform-card">
            <b>Instalar en tu dispositivo</b>
            <span className="ribbon">recomendado</span>
            <p className="muted" style={{ margin: 0 }}>
              Instala FRIDGIE desde tu navegador y accede más fácilmente. Funciona como aplicación propia y guarda contenido para usarlo sin conexión.
            </p>
            <div className="foot">
              {isInstalled ? (
                <span className="pill pill-green">✔ FRIDGIE ya está instalada en este dispositivo</span>
              ) : (
                <button className="btn btn-primary" onClick={() => void install()}>Instalar FRIDGIE</button>
              )}
              {!isInstalled && !canNativeInstall && (
                <p className="muted" style={{ marginTop: '.6rem' }}>
                  Tu navegador ({platform.kind === 'web' ? navigator.platform || 'este dispositivo' : platform.kind}) no ofrece instalación automática ahora mismo.
                  {' '}{outcome?.instructions ?? fallbackHint()}
                </p>
              )}
              {outcome?.status === 'dismissed' && (
                <p className="muted">Instalación cancelada. Puedes volver a intentarlo cuando quieras.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Windows */}
        <Card className="tilt-c">
          <div className="platform-card">
            <b>Aplicación para Windows</b>
            <span className="pill pill-gray badge-soon">Versión de escritorio próximamente</span>
            <p className="muted" style={{ margin: 0 }}>
              Estamos empaquetando FRIDGIE con Tauri para Windows 10/11 (x64, instalador .msi). No publicaremos el botón de descarga hasta que exista un instalador real, compilado y probado.
            </p>
            <div className="foot"><button className="btn btn-ghost" disabled>Descargar para Windows</button></div>
          </div>
        </Card>

        {/* macOS */}
        <Card className="tilt-d">
          <div className="platform-card">
            <b>Aplicación para macOS</b>
            <span className="pill pill-gray badge-soon">Versión de escritorio próximamente</span>
            <p className="muted" style={{ margin: 0 }}>
              Versión .dmg firmada y notarizada (Apple silicon e Intel). Se anunciará solo cuando la build sea pública y verificada.
            </p>
            <div className="foot"><button className="btn btn-ghost" disabled>Descargar para macOS</button></div>
          </div>
        </Card>

        {/* Linux */}
        <Card className="tilt-e">
          <div className="platform-card">
            <b>Aplicación para Linux</b>
            <span className="pill pill-gray badge-soon">Versión de escritorio próximamente</span>
            <p className="muted" style={{ margin: 0 }}>
              Se generarán paquetes específicos por formato (.AppImage, .deb, .rpm) — un mismo instalador no sirve para todas las distribuciones. Cada paquete se publicará cuando esté construido y comprobado.
            </p>
            <div className="foot"><button className="btn btn-ghost" disabled>Descargar para Linux</button></div>
          </div>
        </Card>

        {/* Información de versión */}
        <Card className="tilt-f">
          <div className="platform-card">
            <b>Información de la versión</b>
            <table style={{ width: '100%', fontSize: '.9rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td className="muted">Versión</td><td><b>v{VERSION}</b></td></tr>
                <tr><td className="muted">Plataforma</td><td>Web + PWA (React · Vite)</td></tr>
                <tr><td className="muted">Estado</td><td><span className="pill pill-green">estable</span></td></tr>
                <tr><td className="muted">Escritorio</td><td><span className="pill pill-gray">en preparación (Tauri)</span></td></tr>
                <tr><td className="muted">Requisitos</td><td>Navegador moderno con HTTPS; almacenamiento local habilitado</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ margin: 0 }}>
              Novedades de esta versión: panel de widgets en Inicio, ilustraciones propias, PWA instalable y cola de sincronización offline.
            </p>
          </div>
        </Card>
      </div>

      <section className="marquee-wrap" aria-hidden>
        <div className="marquee">
          {[...Array(2)].map((_, k) => (
            <span key={k} className="marquee-track">
              {(['tomato', 'avocado', 'egg', 'carrot', 'lemon', 'mushroom', 'bread', 'cheese', 'garlic', 'leaf', 'pepper', 'banana'] as const).map((f) => (
                <FoodIcon key={f + k} food={f} size={26} />
              ))}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

function fallbackHint(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'En iPhone/iPad: Compartir → «Añadir a pantalla de inicio».';
  if (/Android/.test(ua)) return 'En Android: menú del navegador → «Instalar aplicación» / «Añadir a pantalla de inicio».';
  return 'Busca en el menú de tu navegador una opción tipo «Instalar» o «Añadir a pantalla de inicio». La disponibilidad depende del navegador y del sistema operativo.';
}
