// ─── Página: Recetas (catálogo offline + IA solo online) ────────────────────
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { searchRecipes, suggestRecipes } from '../core/recipes/engine';
import { generateRecipeWithAI, OfflineError } from '../services/ai';
import type { Recipe } from '../core/types';

export default function RecipesPage() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  const matches = useMemo(() => {
    const found = searchRecipes(s.recipes, q);
    return found.map((recipe) => ({ recipe, match: suggestRecipes([recipe], s.ingredients)[0] }));
  }, [s.recipes, s.ingredients, q]);

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
        favorite: false, imageEmoji: '✨', updatedAt: now, syncStatus: 'pending',
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
      <h1>Recetas</h1>
      <p className="subtitle">Guardadas en tu dispositivo y sincronizadas con tu cuenta. Disponibles sin conexión tras su primera carga.</p>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <input style={{ maxWidth: 360 }} placeholder="Buscar por nombre, tag o ingrediente…"
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar recetas" />
        <button className="btn btn-primary" onClick={askAI} disabled={aiBusy}>
          {aiBusy ? 'Generando…' : '✨ Generar con IA'}
        </button>
        {!s.online && <span className="pill pill-amber">IA requiere conexión</span>}
      </div>
      {aiMsg && <Card><p style={{ margin: 0 }}>{aiMsg}</p></Card>}
      <div className="grid cols-2" style={{ marginTop: '1rem' }}>
        {matches.map(({ recipe, match }) => (
          <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="card">
            <div className="row spread">
              <b style={{ fontSize: '1.05rem' }}>{recipe.imageEmoji} {recipe.title}</b>
              {match && match.missing.length === 0
                ? <span className="pill pill-green">¡La tienes todo!</span>
                : <span className="pill pill-gray">{match ? `${match.covered}/${recipe.ingredients.length}` : ''}</span>}
            </div>
            <p className="muted">{recipe.description}</p>
            <div className="row">{recipe.tags.map((t) => <span key={t} className="pill pill-green">{t}</span>)}</div>
          </Link>
        ))}
        {matches.length === 0 && <p className="muted">No hay recetas que coincidan con «{q}».</p>}
      </div>
    </>
  );
}
