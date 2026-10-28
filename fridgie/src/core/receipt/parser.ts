// ─── Parseador de tickets de compra (lógica pura, sin dependencias) ────────
// Compartida entre web, PWA y futuro escritorio. Funciona SIN CONEXIÓN:
// el texto se procesa localmente; la IA opcional solo mejora el resultado.

export interface ReceiptLine {
  id: string;            // estable mientras no cambie el texto de la línea
  raw: string;           // línea tal cual aparece en el ticket
  name: string;          // nombre normalizado del producto
  quantity: number;
  unit: string;          // 'ud' | 'g' | 'ml' | 'kg' | 'L'
  price?: number;        // € si el ticket lo indica
  section: 'product' | 'meta';   // meta = tienda, fecha, IVA, total… (se ignora)
  include: boolean;      // decisión del usuario en la pantalla de revisión
}

export interface ParsedReceipt {
  lines: ReceiptLine[];
  storeName?: string;
  date?: string;         // ISO si el ticket la lleva
  source: 'text' | 'image-ocr' | 'ai';
}

const uid = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'rl-' + (h >>> 0).toString(36);
};

// Palabras que NUNCA son productos (metadatos del ticket)
const META_WORDS = /\b(total|subtotal|iva|igic|impto|impuesto|ticket|factura|recibo|caja|fecha|hora|tlf|telefono|tel\.?|nif|cif|dni|base|descuento|cambio|vuelto|effectivo|efectivo|tarjeta|cbtu|importe|bruto|neto|doc\W|num\W|no\.?\W|serie|pvp|gracias|visit|sede)\b/i;
const NOISE_ONLY = /^[\s.,:;|_=\-*·•#ºª°©®!¿?¡/\\()[\]{}<>+~^`'"$€£%&@0-9\t]*$/;
const PRICE_ONLY = /^\s*[{[(]?\s*-?\d+[.,]\d{0,2}\s*[})\]]?\s*(€|eur)?\s*$/i;

/** ¿Es una cabecera de tienda? (línea alfabética corta sin números) */
function looksLikeStore(line: string): boolean {
  if (META_WORDS.test(line)) return false;
  const words = line.replace(/[^a-záéíóúñü\s]/gi, '').trim().split(/\s+/).filter((w) => w.length > 2);
  return words.length >= 1 && /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s.&'-]+$/.test(line.trim()) && line.trim().length <= 40;
}

/** Extrae cantidad + unidad + precio de una línea tipo "ACEITE OLI 1,5 L 5,99" */
function extractAmounts(raw: string): { qty: number; unit: string; price?: number; rest: string } {
  let rest = raw;
  // Precio final de línea: número con decimales al final (opcionalmente entre paréntesis o con €)
  let price: number | undefined;
  const pm = rest.match(/(\d+[.,]\d{1,2})\s*(€|EUR)?\s*[)}]?\s*$/i);
  if (pm) {
    price = parseFloat(pm[1].replace(',', '.'));
    rest = rest.slice(0, pm.index).trim();
  }
  // Cantidad + unidad explícitas: "2 ud", "500 g", "1,5 kg", "750 ml", "2 L", "x3"
  let qty = 1;
  let unit = 'ud';
  const qm = rest.match(/(?:^|\s)(?:x\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|ud|u\b|unidades?|pac\b|paquete|bolsa|bote|lata|botella|barra|pack)\b[:.)\]]?\s*/i);
  if (qm) {
    qty = parseFloat(qm[1].replace(',', '.'));
    const u = qm[2].toLowerCase();
    unit = ({ mg: 'g', g: 'g', kg: 'kg', l: 'L', ml: 'ml', ud: 'ud', u: 'ud', unidades: 'ud', unidad: 'ud', pac: 'ud', paquete: 'ud', bolsa: 'ud', bote: 'ud', lata: 'ud', botella: 'ud', barra: 'ud', pack: 'ud' } as Record<string, string>)[u] ?? 'ud';
    if (unit === 'ml' && qty >= 1000) { qty = qty / 1000; unit = 'L'; }
    if (unit === 'g' && qty >= 1000) { qty = qty / 1000; unit = 'kg'; }
    rest = (rest.slice(0, qm.index ?? 0) + ' ' + rest.slice((qm.index ?? 0) + qm[0].length)).trim();
  } else {
    // Unidades pegadas al número: "1,5L", "300g"
    const qj = rest.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(kg|ml|g|l)\b/i);
    if (qj) {
      qty = parseFloat(qj[1].replace(',', '.'));
      unit = qj[2].toLowerCase() === 'ml' ? 'ml' : qj[2].toLowerCase() === 'l' ? 'L' : qj[2].toLowerCase();
      if (unit === 'g' && qty >= 1000) { qty = qty / 1000; unit = 'kg'; }
      rest = (rest.slice(0, qj.index ?? 0) + ' ' + rest.slice((qj.index ?? 0) + qj[0].length)).trim();
    }
  }
  return { qty: qty > 0 ? qty : 1, unit, price, rest };
}

/** Nombre limpio: mayúsculas sueltas → Title case, sin códigos ni restos */
function cleanName(raw: string, rest: string): string {
  let n = rest || raw;
  n = n.replace(/^\W{0,4}/, '');                       // adornos iniciales
  n = n.replace(/\b\d{6,}\b/g, '');                    // códigos EAN largos
  n = n.replace(/\b[A-Z]{1,2}\d{2,}\b/g, '');          // referencias tipo P234
  n = n.replace(/[*†‡§¶]/g, '');
  n = n.replace(/\s{2,}/g, ' ').trim();
  // Title case solo si viene todo en mayúsculas (típico de tickets)
  if (n === n.toUpperCase() && /[ÁÉÍÓÚÑÜA-Z]/.test(n)) {
    n = n.toLowerCase().replace(/(^|[\s/-])([a-záéíóúñü])/g, (_m, s, c) => s + c.toUpperCase());
  }
  return n;
}

/** Algunos OCR devuelven una sola línea larga; trocea cuando detecta
 *  patrones "NOMBRE ... IMPORTE" repetidos. */
function splitOcrLines(text: string): string[] {
  let src = text.replace(/\r\n?/g, '\n');
  if (src.split('\n').length <= 2 && (src.match(/\d+[.,]\d{2}/g) ?? []).length >= 3) {
    src = src.replace(/(\d+[.,]\d{2})\s*(€)?\s+(?=[A-Za-zÁÉÍÓÚÑÜáéíóúñü])/g, '$1$2\n');
  }
  return src.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

export function parseReceiptText(text: string): ParsedReceipt {
  const rows = splitOcrLines(text);
  const lines: ReceiptLine[] = [];
  let storeName: string | undefined;
  let date: string | undefined;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx];
    if (NOISE_ONLY.test(raw) || PRICE_ONLY.test(raw)) continue;

    // Fecha del ticket (solo en el encabezado)
    const dm = raw.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
    if (dm && !date && (idx < 8 || /fecha/i.test(raw))) {
      date = `${dm[3]}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
    }

    if (META_WORDS.test(raw)) continue;

    // Primera línea "limpia" y sin números = nombre de la tienda
    if (!storeName && idx <= 2 && looksLikeStore(raw) && !/\d/.test(raw)) {
      storeName = cleanName(raw, raw);
      continue;
    }

    const { qty, unit, price, rest } = extractAmounts(raw);
    const name = cleanName(raw, rest);
    if (name.length < 2) continue;
    if (/^\d+[.,]?\d*$/.test(name)) continue;

    lines.push({ id: uid(raw), raw, name, quantity: qty, unit, price, section: 'product', include: true });
  }

  // Dedupe por nombre+unidad (tickets duplican líneas del mismo producto)
  const seen = new Map<string, ReceiptLine>();
  for (const l of lines) {
    const k = `${l.name.toLowerCase()}|${l.unit}`;
    const prev = seen.get(k);
    if (prev) { prev.quantity += l.quantity; if (l.price != null && prev.price != null) prev.price += l.price; }
    else seen.set(k, { ...l });
  }

  return { lines: [...seen.values()], storeName, date, source: 'text' };
}
