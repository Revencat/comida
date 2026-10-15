// ─── Página: Despensa ───────────────────────────────────────────────────────
import { useState } from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { addIngredient, removeIngredient } from '../core/ingredients/manager';
import type { Ingredient } from '../core/types';

export default function PantryPage() {
  const s = useStore();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('ud');

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
      <h1>Despensa</h1>
      <p className="subtitle">Consulta y edita aunque no tengas conexión; los cambios se sincronizan al reconectar.</p>
      <form onSubmit={onAdd} className="card row" style={{ gap: '.6rem' }}>
        <input style={{ flex: 2, minWidth: 160 }} placeholder="Ingrediente (ej. Tomate)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del ingrediente" />
        <input style={{ flex: 1, minWidth: 70 }} type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Cantidad" />
        <select style={{ width: 90 }} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unidad">
          <option>ud</option><option>g</option><option>ml</option><option>kg</option><option>L</option>
        </select>
        <button className="btn btn-primary" type="submit">Añadir</button>
      </form>
      <div className="card" style={{ marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', fontSize: '.85rem' }}>
            <th>Producto</th><th>Cantidad</th><th>Caduca</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {s.ingredients.map((i) => (
              <tr key={i.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '.55rem .3rem', fontWeight: 600 }}>{i.name}</td>
                <td>{i.quantity} {i.unit}</td>
                <td className="muted">{i.expiresAt ? new Date(i.expiresAt).toLocaleDateString() : '—'}</td>
                <td><span className={`pill ${i.syncStatus === 'synced' ? 'pill-green' : 'pill-amber'}`}>
                  {i.syncStatus === 'synced' ? 'sincronizado' : 'pendiente'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" onClick={() => onRemove(i)} aria-label={`Quitar ${i.name}`}>Quitar</button>
                </td>
              </tr>
            ))}
            {s.ingredients.length === 0 && <tr><td colSpan={5} className="muted">Tu despensa está vacía. Añade algo 🥕</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
