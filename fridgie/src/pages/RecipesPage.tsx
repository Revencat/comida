// ─── Página: Recetas (catálogo offline + IA solo online) ────────────────────
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Broc, FoodIcon, foodFor, tileStyle } from '../brand/broc';
import { searchRecipes, suggestRecipes } from '../core/recipes/engine';
import { generateRecipeWithAI, OfflineError } from '../services/ai';
import type { Recipe } from '../core/types';

export default function RecipesPage() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  const tags = useMemo(() => Array.from(new Set(s.recipes.flatMap((r) => r.tags))).slice(0, 8), [s.recipes]);

  const matches = useMemo(() => {
    let found = searchRecipes(s.recipes, q);
    if (tag) found = found.filter((r) => r.tags.includes(tag));
    return found.map((recipe) => ({ recipe, match: suggestRecipes([recipe], s.ingredients)[0] }));
  }, [s.recipes, s.ingredients, q, tag]);

  async function askAI() {
    setAiBusy(true); setAiMsg(null);
    try {
      const gen = await generateRecipeWithAI(
        `Receta con: ${s.ingredients.filter((i) => i.quantity > 0).slice(0, 8).map((i) => i.name).join(', ')}`,
        {
          online: s.online,
          apiKey: import.meta.env.VITE_AI_KEY as string | undefined,
          endpoint: import.meta.env.VITE_AI_ENDPOINT as string | undefined,
        },
      );
      const now = Date.now();
      const recipe: Recipe = {
        id: crypto.randomUUID(), ...gen, steps: gen.steps, servings: 2, tags: ['IA'],
        favorite: false, updatedAt: now, syncStatus: 'pending',
      };
      await s.saveRecipe(recipe);
      setAiMsg(`«${recipe.title}» guardada en tus recetas.`);
    } catch (e) {
      // Error honesto: nunca resultados inventados
      setAiMsg(e instanceof OfflineError
        ? 'Sin conexión: la generación con IA no está disponible ahora. Puedes usar las recetas guardadas.'
        : (e as Error).message);
    } finally { setAiBusy(false); }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recetas</h1>
          <p className="subtitle">Guardadas en tu dispositivo y sincronizadas con tu cuenta. Disponibles sin conexión tras su primera carga.</p>
        </div>
        <Broc size={54} variant="chef" title="Broc chef" />
      </div>
      <div className="row" style={{ marginBottom: '.7rem' }}>
        <input style={{ maxWidth: 360 }} placeholder="Buscar por nombre, tag o ingrediente…"
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar recetas" />
        <button className="btn btn-primary" onClick={askAI} disabled={aiBusy}>
          {aiBusy ? 'Generando…' : 'Generar con IA'}
        </button>
        {!s.online && <span className="pill pill-amber">IA requiere conexión</span>}
      </div>
      <div className="tag-row" role="group" aria-label="Filtrar por estilo">
        <button className={`tag ${!tag ? 'on' : ''}`} onClick={() => setTag(null)}>Todas</button>
        {tags.map((t) => (
          <button key={t} className={`tag ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>{t}</button>
        ))}
      </div>
      {aiMsg && <Card><p style={{ margin: 0 }}>{aiMsg}</p></Card>}
      <div className="recipe-grid" style={{ marginTop: '1rem' }}>
        {matches.map(({ recipe, match }) => (
          <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="recipe-card">
            <span className="tile big" style={tileStyle(recipe.id + recipe.title)}>
              <FoodIcon food={foodFor(recipe.ingredients[0]?.name ?? recipe.title)} size={40} />
              {match && match.missing.length === 0 && <em className="have-all">¡la tienes todo!</em>}
            </span>
            <div className="rc-body">
              <b>{recipe.title}</b>
              <p className="muted">{recipe.description}</p>
              <div className="row">
                {recipe.tags.slice(0, 2).map((t) => <span key={t} className="chip"><FoodIcon food="leaf" size={13} />{t}</span>)}
                {match && match.missing.length > 0 && <span className="chip amber">{match.covered}/{recipe.ingredients.length}</span>}
              </div>
            </div>
          </Link>
        ))}
        {matches.length === 0 && <p className="muted">No hay recetas que coincidan con «{q}».</p>}
      </div>
    </>
  );
}
