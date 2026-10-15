// ─── Página: Listas de la compra (edición offline completa) ─────────────────
import { useState } from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Broc, FoodIcon, foodFor } from '../brand/broc';
import { addItem, toggleChecked, removeItem, progress, createList } from '../core/lists/manager';

export default function ListsPage() {
  const s = useStore();
  const [activeId, setActiveId] = useState<string | null>(s.lists[0]?.id ?? null);
  const [text, setText] = useState('');
  const listId = activeId ?? s.lists[0]?.id ?? null;
  const items = s.items.filter((i) => i.listId === listId);
  const prog = listId ? progress(s.items, listId) : { done: 0, total: 0 };

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!listId || !text.trim()) return;
    const next = addItem(s.items, listId, text.trim());
    const created = next.find((n) => !s.items.some((o) => o.id === n.id));
    if (created) await s.saveItem(created);
    setText('');
  }

  async function onToggle(id: string) {
    const t = toggleChecked(s.items, id).find((x) => x.id === id)!;
    await s.saveItem(t);
  }

  async function onRemove(id: string) {
    const t = removeItem(s.items, id).find((x) => x.id === id)!;
    await s.saveItem(t);
  }

  async function onNewList() {
    const l = createList(`Lista ${s.lists.length + 1}`);
    await s.saveList(l);
    setActiveId(l.id);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Listas de la compra</h1>
          <p className="subtitle">Edita y marca comprados sin conexión. Todo se guarda en tu dispositivo y se sincroniza al reconectar.</p>
        </div>
        <Broc size={54} variant="cart" title="Broc con el carrito" />
      </div>
      <div className="row" style={{ marginBottom: '1rem' }}>
        {s.lists.map((l) => (
          <button key={l.id} className={`btn ${l.id === listId ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveId(l.id)}>
            {l.name}
          </button>
        ))}
        <button className="btn btn-secondary" onClick={onNewList}>+ Nueva lista</button>
      </div>
      {listId && (
        <Card>
          <div className="row spread">
            <b>{s.lists.find((l) => l.id === listId)?.name}</b>
            <span className="pill pill-green">{prog.done}/{prog.total} comprados</span>
          </div>
          <div className="progress" style={{ margin: '.6rem 0 1rem' }} aria-hidden>
            <i style={{ width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%` }} />
          </div>
          <form onSubmit={onAdd} className="row">
            <input style={{ flex: 2 }} placeholder="Añadir producto…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Nuevo producto" />
            <button className="btn btn-primary" type="submit">Añadir</button>
          </form>
          <div style={{ marginTop: '.8rem' }}>
            {items.map((i) => (
              <div key={i.id} className={`check-item ${i.checked ? 'done' : ''}`}>
                <input type="checkbox" checked={i.checked} onChange={() => onToggle(i.id)} aria-label={`Marcar ${i.name}`} />
                <FoodIcon food={foodFor(i.name)} size={22} />
                <span style={{ flex: 1 }}>{i.name} <span className="muted">· {i.quantity} {i.unit}</span></span>
                {i.syncStatus !== 'synced' && <span className="pill pill-amber" title="Pendiente de sincronizar">↻</span>}
                <button className="btn btn-ghost tiny" onClick={() => onRemove(i.id)} aria-label={`Quitar ${i.name}`}>×</button>
              </div>
            ))}
            {items.length === 0 && <p className="muted">Lista vacía. ¡Añade lo primero!</p>}
          </div>
        </Card>
      )}
    </>
  );
}
