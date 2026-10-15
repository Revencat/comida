// ─── Página: Detalle de receta — con modo cocina paso a paso ────────────────
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Broc, FoodIcon, foodFor, tileStyle } from '../brand/broc';
import { suggestRecipes } from '../core/recipes/engine';
import { addItem } from '../core/lists/manager';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const s = useStore();
  const [cooking, setCooking] = useState(false);
  const [step, setStep] = useState(0);
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

  if (cooking) {
    const done = step >= recipe.steps.length;
    return (
      <div className="cook-mode">
        <Broc size={64} variant={done ? 'happy' : 'chef'} title={done ? '¡Buen provecho!' : 'Broc cocina contigo'} />
        <p className="cook-kicker">{recipe.title}</p>
        {done ? (
          <>
            <h2 className="cook-step">¡Listo! A comer.</h2>
            <p className="muted">Has completado {recipe.steps.length} pasos. Cuando la hagas otra vez, vuelve a empezar.</p>
          </>
        ) : (
          <>
            <p className="cook-step-num">Paso {step + 1} de {recipe.steps.length}</p>
            <h2 className="cook-step">{recipe.steps[step]}</h2>
            <div className="cook-dots" aria-hidden>
              {recipe.steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}
            </div>
          </>
        )}
        <div className="row" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
          {!done && step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Anterior</button>}
          {!done && <button className="btn btn-primary" onClick={() => setStep(step + 1)}>{done ? 'Empezar' : 'Hecho, siguiente →'}</button>}
          {done && <button className="btn btn-secondary" onClick={() => { setStep(0); }}>Volver a empezar</button>}
          <button className="btn btn-ghost" onClick={() => { setCooking(false); setStep(0); }}>Salir del modo cocina</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="detail-head">
        <span className="tile hero-tile" style={tileStyle(recipe.id + recipe.title)}>
          <FoodIcon food={foodFor(recipe.ingredients[0]?.name ?? recipe.title)} size={56} />
        </span>
        <div>
          <h1>{recipe.title}</h1>
          <p className="subtitle">{recipe.description}</p>
          <div className="meta-chips">
            <span className="chip"><FoodIcon food="leaf" size={14} />{recipe.servings} raciones</span>
            <span className="chip"><FoodIcon food="egg" size={14} />{recipe.steps.length} pasos</span>
            {recipe.tags.map((t) => <span key={t} className="chip green">{t}</span>)}
          </div>
        </div>
      </div>
      <div className="grid cols-2">
        <Card title="Ingredientes">
          {recipe.ingredients.map((i) => {
            const ok = match && !match.missing.some((m) => m.name === i.name);
            return (
              <div key={i.name} className="ing-row">
                <FoodIcon food={foodFor(i.name)} size={24} />
                <span className="ing-name">{i.name}</span>
                <span className="muted">{i.quantity} {i.unit}</span>
                <span className={`pill ${ok ? 'pill-green' : 'pill-amber'}`}>{ok ? 'en despensa' : 'falta'}</span>
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
          <ol className="steps-list">{recipe.steps.map((st, i) => <li key={i} style={{ marginBottom: '.5rem' }}>{st}</li>)}</ol>
          <button className="btn btn-primary" onClick={() => { setCooking(true); setStep(0); }}>Modo cocina, paso a paso</button>
        </Card>
      </div>
      <div className="row" style={{ marginTop: '1rem' }}>
        <Link className="btn btn-ghost" to="/recipes">← Todas las recetas</Link>
        <span className="pill pill-gray">Disponible sin conexión · guardada en tu dispositivo</span>
      </div>
    </>
  );
}
