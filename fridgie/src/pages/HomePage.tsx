// ─── Página: Inicio ─────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Broc, Card } from '../components/ui';
import { cookableNow } from '../core/recipes/engine';
import { expiringSoon } from '../core/ingredients/manager';
import { progress } from '../core/lists/manager';

export default function HomePage() {
  const s = useStore();
  if (!s.loaded) return <p className="muted">Cargando tu cocina…</p>;

  const cookable = cookableNow(s.recipes, s.ingredients);
  const soon = expiringSoon(s.ingredients, 5);
  const mainList = s.lists[0];
  const prog = mainList ? progress(s.items, mainList.id) : { done: 0, total: 0 };

  return (
    <>
      <div className="row spread">
        <div>
          <h1>¡Hola! Soy Broc</h1>
          <p className="subtitle">Tu cocina, siempre a mano. Esto es lo que tienes ahora mismo:</p>
        </div>
        <Broc size={120} />
      </div>
      <div className="grid cols-3">
        <Card title="Puedes cocinar ya">
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 800, color: 'var(--green-700)' }}>{cookable.length}</p>
          <p className="muted">recetas completas con tu despensa actual.</p>
          {cookable[0] && <Link to={`/recipes/${cookable[0].id}`}>Empezar por «{cookable[0].title}» →</Link>}
        </Card>
        <Card title="Caduca pronto">
          <p style={{ fontSize: '2rem', margin: 0, fontWeight: 800, color: soon.length ? '#9a6b00' : 'var(--green-700)' }}>{soon.length}</p>
          <p className="muted">{soon.length ? soon.slice(0, 3).map((i) => i.name).join(', ') : 'todo fresco por ahora.'}</p>
          <Link to="/pantry">Revisar despensa →</Link>
        </Card>
        <Card title="Compra semanal">
          <div className="progress" aria-hidden><i style={{ width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%` }} /></div>
          <p className="muted">{prog.done}/{prog.total} productos comprados.</p>
          <Link to="/lists">Ir a las listas →</Link>
        </Card>
      </div>
      <h2>Sugerencias con lo que tienes</h2>
      <div className="grid cols-2">
        {s.recipes.slice(0, 4).map((r) => (
          <Link key={r.id} to={`/recipes/${r.id}`} className="card row" style={{ gap: '1rem' }}>
            <span style={{ fontSize: '1.8rem' }} aria-hidden>{r.imageEmoji}</span>
            <span><b>{r.title}</b><br /><span className="muted">{r.description}</span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
