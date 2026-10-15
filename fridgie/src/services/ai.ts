// ─── IA generativa: SOLO en línea. Nunca resultados inventados offline. ─────
// Genera recetas personalizadas vía un servicio externo. Si no hay conexión o
// no hay proveedor configurado, devuelve un error explícito que la UI muestra
// tal cual (requisito C: "indícalo claramente").

export interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: string[];
}

export class OfflineError extends Error {
  constructor() {
    super('La generación de recetas con IA necesita conexión a Internet.');
    this.name = 'OfflineError';
  }
}

export async function generateRecipeWithAI(
  prompt: string,
  opts: { online: boolean; apiKey?: string; endpoint?: string },
): Promise<GeneratedRecipe> {
  if (!opts.online || !navigator.onLine) throw new OfflineError();
  if (!opts.apiKey || !opts.endpoint) {
    throw new Error(
      'No hay servicio de IA configurado (VITE_AI_ENDPOINT / clave). ' +
      'Conéctalo en Ajustes → Aplicación para activar esta función.',
    );
  }
  const res = await fetch(opts.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`El servicio de IA respondió ${res.status}. Inténtalo más tarde.`);
  const json = await res.json();
  if (!json.title || !Array.isArray(json.ingredients)) {
    throw new Error('Respuesta de IA no válida. No se ha guardado nada.');
  }
  return json as GeneratedRecipe;
}

/** Resultado del enriquecimiento opcional de un ticket con IA. */
export interface EnrichedReceiptItem { name: string; quantity: number; unit: string }
export interface EnrichedReceipt { items: EnrichedReceiptItem[]; storeName?: string }

/** Enriquece el texto crudo de un ticket vía IA externa. Opcional: si no hay
 *  proveedor o conexión, la app usa igualmente el parser local determinista. */
export async function parseReceiptWithAI(
  rawText: string,
  opts: { online: boolean; apiKey?: string; endpoint?: string },
): Promise<EnrichedReceipt> {
  if (!opts.online || !navigator.onLine) throw new OfflineError();
  if (!opts.apiKey || !opts.endpoint) {
    throw new Error('No hay servicio de IA configurado para leer tickets.');
  }
  const res = await fetch(opts.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      task: 'receipt',
      prompt: 'Extrae los productos comprados de este ticket. Responde SOLO JSON: {"storeName":string,"items":[{"name":string,"quantity":number,"unit":"ud|g|ml|kg|L"}]} sin texto adicional.\n\n' + rawText.slice(0, 4000),
    }),
  });
  if (!res.ok) throw new Error(`El servicio de IA respondió ${res.status}.`);
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : null;
  if (!items) throw new Error('La IA no devolvió una lista de productos válida.');
  return {
    storeName: typeof json.storeName === 'string' ? json.storeName : undefined,
    items: items
      .filter((i: unknown) => i && typeof (i as EnrichedReceiptItem).name === 'string')
      .map((i: EnrichedReceiptItem) => ({
        name: String(i.name).trim(),
        quantity: Number.isFinite(i.quantity) && i.quantity > 0 ? i.quantity : 1,
        unit: ['g', 'ml', 'kg', 'L'].includes(i.unit) ? i.unit : 'ud',
      })),
  };
}
