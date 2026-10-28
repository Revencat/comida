// ─── Página: Escanear ticket — de la foto a la despensa sin teclear nada ────
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Broc, FoodIcon, foodFor } from '../brand/broc';
import { parseReceiptText, type ReceiptLine } from '../core/receipt/parser';
import { SAMPLE_TICKETS } from '../core/receipt/samples';
import { matchReceiptLine, type MatchKind } from '../core/receipt/matcher';
import { applyLinesToPantry, buildPurchaseList } from '../core/receipt/apply';
import { recognizeReceiptImage, OcrUnavailableError } from '../services/ocr';
import { parseReceiptWithAI } from '../services/ai';
import { supabaseConfigured } from '../services/supabase/client';

type Stage = 'input' | 'review' | 'done';

/** ¿Puede usarse la IA para leer tickets? Solo si hay proveedor Y sesión real.
 *  Así no se exponen claves ni se finge una conexión que no existe. */
export function receiptAiAvailable(online: boolean): boolean {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
  const key = import.meta.env.VITE_AI_KEY as string | undefined;
  return Boolean(online && endpoint && key && supabaseConfigured());
}

const KIND_LABEL: Record<MatchKind, string> = {
  exact: 'Ya en tu nevera',
  synonym: 'Es lo mismo (sinónimo)',
  fuzzy: 'Se parece a…',
  new: 'Producto nuevo',
};

export default function ScanReceiptPage() {
  const s = useStore();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('input');
  const [rawText, setRawText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrPct, setOcrPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [meta, setMeta] = useState<{ storeName?: string; date?: string; source: 'text' | 'image-ocr' | 'ai' }>({ source: 'text' });
  const [usedAi, setUsedAi] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // Edición ligera en la revisión
  const patch = (id: string, p: Partial<ReceiptLine>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const analyzeText = useCallback(async (text: string, source: 'text' | 'image-ocr') => {
    setError(null);
    if (!text.trim()) { setError('No se ha reconocido ningún texto. Prueba con una foto más nítida o pega el contenido del ticket.'); return; }
    let parsed = parseReceiptText(text);

    // Enriquecimiento opcional con IA (solo si hay proveedor configurado, sesión y conexión)
    if (source === 'image-ocr' && receiptAiAvailable(true) && parsed.lines.length <= 2) {
      try {
        const enriched = await parseReceiptWithAI(text, {
          online: true,
          apiKey: import.meta.env.VITE_AI_KEY as string,
          endpoint: import.meta.env.VITE_AI_ENDPOINT as string,
        });
        if (enriched.items.length > parsed.lines.length) {
          parsed = {
            lines: enriched.items.map((i, n) => ({
              id: `ai-${n}-${i.name}`, raw: `${i.name} ${i.quantity}${i.unit}`, name: i.name,
              quantity: i.quantity, unit: i.unit, section: 'product', include: true,
            })),
            storeName: enriched.storeName ?? parsed.storeName, date: parsed.date, source: 'ai',
          };
          setUsedAi(true);
        }
      } catch { /* seguimos con el parser local, sin inventar nada */ }
    }

    if (!parsed.lines.length) { setError('El ticket no contiene productos reconocibles. Revisa la foto o corrige el texto manualmente.'); return; }
    setLines(parsed.lines);
    setMeta({ storeName: parsed.storeName, date: parsed.date, source: parsed.source });
    setStage('review');
  }, []);

  async function onFile(f: File | null) {
    if (!f) return;
    setError(null);
    setUsedAi(false);
    if (f.type.startsWith('text/') || f.name.endsWith('.txt')) {
      setRawText(await f.text());
      setPreviewUrl(null);
      await analyzeText(await f.text(), 'text');
      return;
    }
    if (!f.type.startsWith('image/')) { setError('Formato no admitido. Sube una foto (JPG/PNG) o un .txt con el texto del ticket.'); return; }
    setPreviewUrl(URL.createObjectURL(f));
    if (!navigator.onLine) {
      setError('Estás sin conexión: el lector óptico necesita Internet la primera vez. Puedes pegar el texto del ticket abajo igualmente.');
      return;
    }
    setOcrPct(0);
    try {
      const text = await recognizeReceiptImage(f, setOcrPct);
      setRawText(text);
      await analyzeText(text, 'image-ocr');
    } catch (e) {
      setError(e instanceof OcrUnavailableError ? e.message : 'No se pudo leer la imagen. Prueba con otra foto o pega el texto.');
    } finally {
      setOcrPct(null);
    }
  }

  const included = useMemo(() => lines.filter((l) => l.include), [lines]);
  const matches = useMemo(
    () => new Map(included.map((l) => [l.id, matchReceiptLine(l, s.ingredients)])),
    [included, s.ingredients],
  );
  const newCount = included.filter((l) => matches.get(l.id)?.kind === 'new').length;
  const restockCount = included.length - newCount;

  async function confirm() {
    if (!included.length) return;
    const { changed } = applyLinesToPantry(s.ingredients, included);
    const { list, items } = buildPurchaseList(meta.storeName, included);
    await s.saveMany({ ingredients: changed, lists: [list], items });
    void s.syncNow();
    setSummary(
      `${changed.length} ingrediente(s) en tu nevera (${newCount} nuevos, ${restockCount} repuestos)` +
      (items.length ? ` · lista «${list.name}» creada con ${items.length} productos marcados como comprados` : ''),
    );
    setStage('done');
    window.dispatchEvent(new CustomEvent('fridgie-toast', { detail: 'Ticket añadido a la despensa ✔' }));
  }

  if (stage === 'done') {
    return (
      <div className="receipt-done">
        <Broc size={110} variant="happy" title="Broc guardando tu compra" />
        <h1>¡Listo! Tu compra ya está en FRIDGIE</h1>
        <p className="subtitle">{summary}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => nav('/pantry')}>Ver la despensa</button>
          <button className="btn btn-secondary" onClick={() => nav('/lists')}>Ver la lista</button>
          <button className="btn btn-ghost" onClick={() => { setStage('input'); setLines([]); setRawText(''); setPreviewUrl(null); setSummary(null); }}>Escanear otro</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Escanear ticket</h1>
          <p className="subtitle">
            Haz una foto al ticket y FRIDGIE añade los productos a tu despensa automáticamente. Nada de teclear.
            {!s.online && ' El reconocimiento óptico necesita conexión; pegar el texto sí funciona sin ella.'}
          </p>
        </div>
        <Broc size={54} variant="cart" title="Broc con el ticket" />
      </div>

      {stage === 'input' && (
        <div className="receipt-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files?.[0] ?? null); }}
        >
          <input ref={fileRef} type="file" accept="image/*,.txt" hidden onChange={(e) => void onFile(e.target.files?.[0] ?? null)} />
          <button className="btn btn-primary big" onClick={() => fileRef.current?.click()}>
            📸 Subir foto del ticket
          </button>
          <span className="muted">o arrástrala aquí · JPG, PNG o archivo de texto</span>
          <div className="row" style={{ justifyContent: 'center' }}>
            <span className="muted">¿Quieres probarla? Usa un ticket de ejemplo:</span>
            {SAMPLE_TICKETS.map((t) => (
              <button key={t.id} className="btn btn-secondary" onClick={() => { setRawText(t.text); void analyzeText(t.text, 'text'); }}>{t.label}</button>
            ))}
          </div>
          {previewUrl && <img src={previewUrl} alt="Vista previa del ticket" className="receipt-preview" />}
          {ocrPct != null && (
            <div className="ocr-progress" role="progressbar" aria-valuenow={ocrPct} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${ocrPct}%` }} /><span>Leyendo el ticket… {ocrPct}%</span>
            </div>
          )}
          <details className="paste-box">
            <summary>¿Tienes tu propio ticket? Pega aquí su texto</summary>
            <textarea rows={7} value={rawText} placeholder={'MERCA-DONA MADRID\nTomate rama 1,20\nLeche semi 1L 1,05\nHUEVOS L 12 ud 2,15\nTOTAL 18,40 €'} onChange={(e) => setRawText(e.target.value)} />
            <button className="btn btn-secondary" onClick={() => void analyzeText(rawText, 'text')}>Analizar texto</button>
          </details>
          {error && <p className="error-text" role="alert">{error}</p>}
        </div>
      )}

      {stage === 'review' && (
        <section className="card receipt-review">
          <header className="row spread">
            <div>
              <h2 style={{ margin: 0 }}>{meta.storeName ?? 'Tu ticket'}</h2>
              <p className="muted" style={{ margin: '.2rem 0 0' }}>
                {meta.date ? new Date(meta.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' : ''}
                {usedAi ? 'Interpretado con IA' : meta.source === 'image-ocr' ? 'Reconocido de la imagen' : 'Texto analizado localmente'} · revisa antes de guardar
              </p>
            </div>
            <Broc size={44} variant="chef" title="Broc revisando" />
          </header>

          <ul className="receipt-lines">
            {lines.map((l) => {
              const m = matches.get(l.id);
              return (
                <li key={l.id} className={!l.include ? 'off' : ''}>
                  <label className="check">
                    <input type="checkbox" checked={l.include} onChange={(e) => patch(l.id, { include: e.target.checked })} aria-label={`Incluir ${l.name}`} />
                  </label>
                  <FoodIcon food={foodFor(l.name)} size={26} />
                  <input className="r-name" value={l.name} onChange={(e) => patch(l.id, { name: e.target.value })} aria-label="Nombre del producto" />
                  <input className="r-qty" type="number" min="0" step="any" value={l.quantity} onChange={(e) => patch(l.id, { quantity: Number(e.target.value) || 0 })} aria-label="Cantidad" />
                  <select className="r-unit" value={l.unit} onChange={(e) => patch(l.id, { unit: e.target.value })} aria-label="Unidad">
                    <option>ud</option><option>g</option><option>kg</option><option>ml</option><option>L</option>
                  </select>
                  {l.price != null && <span className="r-price muted">{l.price.toFixed(2)} €</span>}
                  {l.include && m && (
                    <span className={`pill ${m.kind === 'new' ? 'pill-green' : 'pill-gray'} r-tag`} title={m.ingredient ? `Se sumará a «${m.ingredient.name}»` : 'Nuevo en la despensa'}>
                      {KIND_LABEL[m.kind]}{m.kind !== 'new' && m.ingredient ? ` · ${m.ingredient.name}` : ''}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {error && <p className="error-text" role="alert">{error}</p>}

          <footer className="row spread receipt-actions">
            <span className="muted">{included.length} producto(s) · {newCount} nuevo(s) · {restockCount} repuesto(s)</span>
            <span className="row">
              <button className="btn btn-ghost" onClick={() => { setStage('input'); setError(null); }}>Corregir texto</button>
              <button className="btn btn-primary" onClick={() => void confirm()} disabled={!included.length}>Añadir a mi despensa</button>
            </span>
          </footer>
        </section>
      )}
    </>
  );
}
