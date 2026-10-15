// ─── OCR de tickets: Tesseract.js cargado bajo demanda desde CDN ───────────
// Solo se descarga cuando el usuario sube una foto (no penaliza el bundle).
// Si el navegador está offline o el CDN falla, lanzamos un error EXPLÍCITO:
// nunca inventamos texto (requisito C del proyecto).

export class OcrUnavailableError extends Error {
  constructor() {
    super(
      'No se ha podido iniciar el lector de tickets. El OCR se descarga bajo demanda y necesita conexión la primera vez. ' +
      'Puedes pegar el texto del ticket manualmente igualmente.',
    );
    this.name = 'OcrUnavailableError';
  }
}

let enginePromise: Promise<unknown> | null = null;

async function loadTesseract(): Promise<any> {
  // @ts-ignore — módulo externo sin tipos locales; se carga desde CDN solo en uso real
  const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js')
    .catch(() => { throw new OcrUnavailableError(); });
  return mod;
}

/** Reconoce texto español en una imagen de ticket. Devuelve texto plano. */
export async function recognizeReceiptImage(file: File, onProgress?: (pct: number) => void): Promise<string> {
  if (!navigator.onLine) throw new OcrUnavailableError();
  const Tesseract = await (enginePromise ??= loadTesseract());
  try {
    const worker = await Tesseract.createWorker('spa', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
      },
    });
    try {
      const { data } = await worker.recognize(file);
      return data.text ?? '';
    } finally {
      await worker.terminate();
    }
  } catch (e) {
    if (e instanceof OcrUnavailableError) throw e;
    throw new OcrUnavailableError();
  }
}
