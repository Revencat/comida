// ─── Página: Despensa — "la nevera" de FRIDGIE ──────────────────────────────
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Broc, FoodIcon, foodFor } from '../brand/broc';
import { addIngredient, removeIngredient, expiringSoon } from '../core/ingredients/manager';
import type { Ingredient } from '../core/types';

const GROUPS = [
  { key: 'fruits', label: 'Frutas y verduras', re: /tomate|patata|cebolla|zanahoria|calabac|pepino|lechuga|espinaca|aguacate|pl[aá]tano|manzana|naranja|lim[oó]n|fresa|pimiento|ajo|seta|champi|br[oó]coli/i },
  { key: 'dairy', label: 'Lácteos y huevos', re: /leche|yogur|queso|huevo|mantequilla|nata/i },
  { key: 'pantry', label: 'Secos y despensa', re: /arroz|pasta|pan\b|harina|legumbre|garbanzo|lenteja|aceite|sal|az[uú]car|soja|especie|pimienta/i },
];

export default function PantryPage() {
  const s = useStore();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('ud');

  const groups = useMemo(() => {
    const map = new Map<string, Ingredient[]>();
    for (const g of GROUPS) map.set(g.key, []);
    const other: Ingredient[] = [];
    for (const i of s.ingredients) {
      const g = GROUPS.find((x) => x.re.test(i.name));
      if (g) map.get(g.key)!.push(i); else other.push(i);
    }
    map.set('other', other);
    return [...GROUPS.map((g) => ({ ...g, items: map.get(g.key)! })), { key: 'other', label: 'Otros', items: other as Ingredient[] }]
      .filter((g) => g.items.length > 0);
  }, [s.ingredients]);

  const soonIds = useMemo(() => new Set(expiringSoon(s.ingredients, 3).map((i) => i.id)), [s.ingredients]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const updated = addIngredient(s.ingredients, name.trim(), Number(qty) || 1, unit);
    const changed = updated.find((i) => !s.ingredients.some((o) => o.id === i.id || o.updatedAt !== i.updatedAt));
    if (changed) await s.saveIngredient(changed);
    else {
      // cantidad sumada a un existente
      const existing = updated.find((i) => {
        const prev = s.ingredients.find((o) => o.id === i.id);
        return prev && prev.quantity !== i.quantity;
      });
      if (existing) await s.saveIngredient(existing);
    }
    setName(''); setQty('1');
  }

  async function onRemove(i: Ingredient) {
    const updated = removeIngredient(s.ingredients, i.id);
    const t = updated.find((x) => x.id === i.id)!;
    await s.saveIngredient(t);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Despensa</h1>
          <p className="subtitle">Consulta y edita aunque no tengas conexión; los cambios se sincronizan al reconectar.</p>
        </div>
        <Broc size={54} variant="idle" title="Broc revisando la nevera" />
      </div>
      <form onSubmit={onAdd} className="card row shelf-form" style={{ gap: '.6rem' }}>
        <input style={{ flex: 2, minWidth: 160 }} placeholder="Ingrediente (ej. Tomate)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del ingrediente" />
        <input style={{ flex: 1, minWidth: 70 }} type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Cantidad" />
        <select style={{ width: 90 }} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unidad">
          <option>ud</option><option>g</option><option>ml</option><option>kg</option><option>L</option>
        </select>
        <button className="btn btn-primary" type="submit">Guardar en la nevera</button>
      </form>

      <div className="shelf-grid">
        {groups.map((g) => (
          <section key={g.key} className={`shelf ${g.items.some((i) => soonIds.has(i.id)) ? 'alert-shelf' : ''}`}>
            <header><h3>{g.label}</h3><span className="count">{g.items.length}</span></header>
            <ul>
              {g.items.map((i) => (
                <li key={i.id} className={soonIds.has(i.id) ? 'expiring' : ''}>
                  <FoodIcon food={foodFor(i.name)} size={26} />
                  <span className="p-name">{i.name}<small>{i.quantity} {i.unit}{i.expiresAt ? ` · caduca ${new Date(i.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}</small></span>
                  <span className={`pill ${i.syncStatus === 'synced' ? 'pill-green' : 'pill-amber'}`} title={i.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente de sincronizar'}>
                    {i.syncStatus === 'synced' ? 'sync' : '↻'}
                  </span>
                  <button className="btn btn-ghost tiny" onClick={() => onRemove(i)} aria-label={`Quitar ${i.name}`}>×</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && (
          <Card><p className="muted" style={{ margin: 0 }}>Tu despensa está vacía. Añade algo desde el formulario de arriba.</p></Card>
        )}
      </div>
    </>
  );
}
