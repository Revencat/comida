// ─── Página: Inicio — panel de widgets vivos de FRIDGIE ─────────────────────
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { WidgetsArea } from '../components/widgets';
import { FoodIcon, foodFor, tileStyle } from '../brand/broc';
import { searchRecipes } from '../core/recipes/engine';
import { useInstall } from '../hooks/useInstall';

export default function HomePage() {
  const s = useStore();
  const install = useInstall();
  // Recetas "para explorar": rotación determinista según la hora → la web varía
  const hourSeed = Math.floor(Date.now() / 3_600_000);
  const explore = useMemo(() => {
    const all = searchRecipes(s.recipes, '');
    if (all.length === 0) return [];
    const start = hourSeed % all.length;
    return [...all.slice(start), ...all.slice(0, start)].slice(0, 4);
  }, [s.recipes, hourSeed]);

  if (!s.loaded) {
    return (
      <div className="loading-stage">
        <span className="loader-broc" aria-hidden />
        <p className="muted">Abriendo la nevera…</p>
      </div>
    );
  }

  return (
    <>
      <WidgetsArea installProps={{ canNativeInstall: install.canNativeInstall, isInstalled: install.isInstalled, install: () => void install.install() }} />

      <section className="strip">
        <h2>Para explorar <span className="muted rotate-note">— cambia cada hora con lo que tienes</span></h2>
        <div className="recipe-strip">
          {explore.map((r) => (
            <Link key={r.id} to={`/recipes/${r.id}`} className="mini-card">
              <span className="tile" style={tileStyle(r.id + r.title)}>
                <FoodIcon food={foodFor(r.ingredients[0]?.name ?? r.title)} size={28} />
              </span>
              <b>{r.title}</b>
              <span className="muted">{r.tags[0] ?? 'receta'}</span>
            </Link>
          ))}
        </div>
        <Link to="/recipes" className="btn btn-ghost see-all">Ver todas las recetas →</Link>
      </section>
    </>
  );
}
