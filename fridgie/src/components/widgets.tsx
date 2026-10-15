// ─── Sistema de widgets del panel de FRIDGIE ────────────────────────────────
// Cada widget es una tarjeta viva: cambia con la hora, los datos reales y el
// estado del dispositivo. La disposición varía según la franja horaria para
// que la web nunca parezca una plantilla estática.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Broc, FoodIcon, foodFor, tileStyle } from '../brand/broc';
import { cookableNow, suggestRecipes } from '../core/recipes/engine';
import { expiringSoon } from '../core/ingredients/manager';
import { progress } from '../core/lists/manager';
import { greeting, currentMeal, tipOfDay, seasonOf, brocMood, timeBand } from '../core/widgets';
import type { Recipe } from '../core/types';

/** Reloj en vivo (solo UI; no forma parte del core). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}

function Widget({ children, className = '', accent }: { children: ReactNode; className?: string; accent?: string }) {
  return <article className={`widget ${className}`} style={accent ? ({ ['--w-accent' as string]: accent }) : undefined}>{children}</article>;
}

/* ── 1 · Broc en directo: saludo + estado según datos reales ── */
function BrocWidget() {
  const s = useStore();
  const now = useNow();
  const mood = useMemo(() => brocMood(s.recipes, s.ingredients, s.items, now), [s.recipes, s.ingredients, s.items, now]);
  const meal = currentMeal(now);
  return (
    <Widget className="broc-widget wide">
      <div className="broc-stage" data-season={seasonOf(now).key}>
        <span className="sun-moon" aria-hidden />
        <Broc size={84} variant={mood.variant} title={`Broc, ${meal.name.toLowerCase()}`} />
      </div>
      <div className="broc-say">
        <p className="hello">{greeting(now)} — <b>{meal.name}</b></p>
        <p className="mood">{mood.message}</p>
        <p className="clock muted">{now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </Widget>
  );
}

/* ── 2 · Fresura: anillo con ingredientes a punto de caducar ── */
function FreshnessWidget() {
  const s = useStore();
  const soon = expiringSoon(s.ingredients, 5);
  const total = s.ingredients.filter((i) => i.expiresAt).length;
  const pct = total ? Math.round(((total - soon.length) / total) * 100) : 100;
  const R = 34, C = 2 * Math.PI * R;
  return (
    <Widget className="ring-widget">
      <header><h3>Frescura de la despensa</h3><Link to="/pantry" className="w-go">ver →</Link></header>
      <div className="row" style={{ gap: '1rem' }}>
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r={R} fill="none" stroke="var(--green-100)" strokeWidth="10" />
          <circle cx="46" cy="46" r={R} fill="none" stroke="url(#freshGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 46 46)" className="ring-anim" />
          <defs><linearGradient id="freshGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fd6a2" /><stop offset="1" stopColor="#1b7a43" /></linearGradient></defs>
          <text x="46" y="52" textAnchor="middle" className="ring-num">{pct}%</text>
        </svg>
        <div className="mini-list">
          {soon.slice(0, 3).map((i) => (
            <span key={i.id} className="chip amber"><FoodIcon food={foodFor(i.name)} size={16} />{i.name}</span>
          ))}
          {soon.length === 0 && <span className="chip green"><FoodIcon food="leaf" size={16} />todo fresco</span>}
        </div>
      </div>
    </Widget>
  );
}

/* ── 3 · Compra: progreso animado de la lista activa ── */
function ShoppingWidget() {
  const s = useStore();
  const list = s.lists[0];
  const prog = list ? progress(s.items, list.id) : { done: 0, total: 0 };
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const next = s.items.filter((i) => !i.checked && !i.deleted).slice(0, 4);
  return (
    <Widget className="shop-widget">
      <header><h3>{list?.name ?? 'Tu compra'}</h3><Link to="/lists" className="w-go">editar →</Link></header>
      <div className="bar"><i style={{ width: `${pct}%` }} /><em>{pct}%</em></div>
      <div className="mini-list" style={{ marginTop: '.7rem' }}>
        {next.map((i) => (
          <span key={i.id} className="chip"><FoodIcon food={foodFor(i.name)} size={16} />{i.name}</span>
        ))}
        {next.length === 0 && <span className="muted" style={{ fontSize: '.85rem' }}>Lista completada ✦</span>}
      </div>
    </Widget>
  );
}

/* ── 4 · Cocinable ahora: carrusel de recetas que sí puedes hacer ── */
function CookableWidget() {
  const s = useStore();
  const [idx, setIdx] = useState(0);
  const cookable = useMemo(() => cookableNow(s.recipes, s.ingredients), [s.recipes, s.ingredients]);
  useEffect(() => {
    if (cookable.length < 2) return;
    const iv = setInterval(() => setIdx((i) => (i + 1) % cookable.length), 5200);
    return () => clearInterval(iv);
  }, [cookable.length]);
  const r: Recipe | undefined = cookable[idx % Math.max(cookable.length, 1)];
  return (
    <Widget className="carousel-widget">
      <header><h3>Puedes cocinar ahora</h3><span className="pill pill-green">{cookable.length}</span></header>
      {r ? (
        <Link to={`/recipes/${r.id}`} className="slide" key={r.id}>
          <span className="tile" style={tileStyle(r.title)}><FoodIcon food={foodFor(r.ingredients[0]?.name ?? r.title)} size={30} /></span>
          <span className="slide-txt"><b>{r.title}</b><span className="muted">{r.steps.length} pasos · {r.servings} raciones</span></span>
        </Link>
      ) : (
        <p className="muted" style={{ margin: '.4rem 0' }}>Con tu despensa actual no tienes una receta completa. Revisa qué falta en Recetas.</p>
      )}
      {cookable.length > 1 && (
        <div className="dots" aria-hidden>{cookable.map((c, i) => <i key={c.id} className={i === idx % cookable.length ? 'on' : ''} />)}</div>
      )}
    </Widget>
  );
}

/* ── 5 · Sugerencia con lo que falta comprar ── */
function AlmostWidget() {
  const s = useStore();
  const almost = useMemo(
    () => suggestRecipes(s.recipes, s.ingredients).filter((m) => m.score >= 0.6 && m.missing.length <= 2).slice(0, 3),
    [s.recipes, s.ingredients],
  );
  if (almost.length === 0) return null;
  return (
    <Widget className="almost-widget">
      <header><h3>Casi listas</h3><span className="muted" style={{ fontSize: '.78rem' }}>te faltan 1-2 cosas</span></header>
      {almost.map((m) => (
        <Link key={m.recipe.id} to={`/recipes/${m.recipe.id}`} className="almost-row">
          <FoodIcon food={foodFor(m.recipe.title)} size={20} />
          <b>{m.recipe.title}</b>
          <span className="missing">{m.missing.map((x) => x.name).join(', ')}</span>
        </Link>
      ))}
    </Widget>
  );
}

/* ── 6 · Estación + consejo del día (contenido que varía) ── */
function SeasonWidget() {
  const now = useNow(60_000);
  const season = seasonOf(now);
  return (
    <Widget className={`season-widget season-${season.key}`}>
      <header><h3>De temporada</h3></header>
      <p className="season-label">{season.label}</p>
      <p className="tip">💡 <span>{tipOfDay(now)}</span></p>
    </Widget>
  );
}

/* ── 7 · Estado del dispositivo: PWA / conexión / pendientes ── */
function DeviceWidget({ canNativeInstall, isInstalled, install }: {
  canNativeInstall: boolean; isInstalled: boolean; install: () => void;
}) {
  const s = useStore();
  return (
    <Widget className="device-widget">
      <header><h3>FRIDGIE en ti</h3><Link to="/download" className="w-go">descargar →</Link></header>
      <ul className="status-list">
        <li><span className={`dot ${s.online ? 'ok' : 'warn'}`} />{s.online ? 'Conectado con la nube' : 'Sin conexión — modo offline activo'}</li>
        <li><span className={`dot ${s.sync.pendingCount ? 'warn' : 'ok'}`} />{s.sync.pendingCount ? `${s.sync.pendingCount} cambio(s) en cola` : 'Todo sincronizado'}</li>
        <li><span className={`dot ${isInstalled ? 'ok' : 'idle'}`} />{isInstalled ? 'PWA instalada en este dispositivo' : canNativeInstall ? 'Pendiente de instalar' : 'Modo web en navegador'}</li>
      </ul>
      {!isInstalled && (
        <button className="btn btn-primary install-mini" onClick={install}>Instalar FRIDGIE</button>
      )}
    </Widget>
  );
}

/* ── Compositor: el orden de los widgets varía según la franja horaria ── */
export function WidgetsArea({ installProps }: { installProps: { canNativeInstall: boolean; isInstalled: boolean; install: () => void } }) {
  const now = useNow(60_000);
  const band = timeBand(now);
  const order = useMemo(() => {
    const base = ['broc', 'fresh', 'shop', 'cook', 'almost', 'season', 'device'];
    // Mañana: frescura primero; tarde: recetas; noche: compra y dispositivo.
    if (band === 'mañana') return ['broc', 'fresh', 'cook', 'shop', 'almost', 'season', 'device'];
    if (band === 'mediodía' || band === 'tarde') return ['broc', 'cook', 'almost', 'fresh', 'shop', 'season', 'device'];
    return ['broc', 'shop', 'device', 'fresh', 'cook', 'almost', 'season'];
  }, [band]);
  const parts: Record<string, ReactNode> = {
    broc: <BrocWidget key="broc" />,
    fresh: <FreshnessWidget key="fresh" />,
    shop: <ShoppingWidget key="shop" />,
    cook: <CookableWidget key="cook" />,
    almost: <AlmostWidget key="almost" />,
    season: <SeasonWidget key="season" />,
    device: <DeviceWidget key="device" {...installProps} />,
  };
  return <div className={`widgets band-${band}`}>{order.map((k) => parts[k])}</div>;
}
