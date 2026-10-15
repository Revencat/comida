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
