// ─── Página: Detalle de receta ──────────────────────────────────────────────
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { suggestRecipes } from '../core/recipes/engine';
import { addItem } from '../core/lists/manager';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const s = useStore();
  const recipe = s.recipes.find((r) => r.id === id);
  if (!recipe) return <p className="muted">Receta no encontrada. <Link to="/recipes">Volver</Link></p>;

  const match = suggestRecipes([recipe], s.ingredients)[0];

  async function addMissingToList() {
    const list = s.lists[0];
    if (!list) return;
    // añadir de forma idempotente usando el manager puro (fusiona duplicados)
    let next = s.items;
    for (const m of match.missing) next = addItem(next, list.id, m.name, m.quantity, m.unit);
    for (const it of next.filter((n) => !s.items.some((o) => o.id === n.id))) {
      await s.saveItem(it);
    }
  }

  return (
    <>
      <h1>{recipe.imageEmoji} {recipe.title}</h1>
      <p className="subtitle">{recipe.description}</p>
      <div className="grid cols-2">
        <Card title={`Ingredientes · ${recipe.servings} raciones`}>
          {recipe.ingredients.map((i) => {
            const ok = match && !match.missing.some((m) => m.name === i.name);
            return (
              <div key={i.name} className="row spread" style={{ borderBottom: '1px dashed var(--line)', padding: '.4rem 0' }}>
                <span>{i.name}</span>
                <span><span className="muted">{i.quantity} {i.unit}</span> {ok ? <span className="pill pill-green">en despensa</span> : <span className="pill pill-amber">falta</span>}</span>
              </div>
            );
          })}
          {match && match.missing.length > 0 && (
            <button className="btn btn-secondary" style={{ marginTop: '.8rem' }} onClick={addMissingToList}>
              Añadir lo que falta a «{s.lists[0]?.name ?? 'lista'}»
            </button>
          )}
        </Card>
        <Card title="Elaboración">
          <ol>{recipe.steps.map((st, i) => <li key={i} style={{ marginBottom: '.5rem' }}>{st}</li>)}</ol>
        </Card>
      </div>
      <div className="row" style={{ marginTop: '1rem' }}>
        <Link className="btn btn-ghost" to="/recipes">← Todas las recetas</Link>
        <span className="pill pill-gray">Disponible sin conexión · guardada en tu dispositivo</span>
      </div>
    </>
  );
}
