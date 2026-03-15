/**
 * dateParser.js
 * Responsabilidad: detectar y normalizar fechas en texto natural.
 *
 * Prioridad de detección:
 *  1. dd/mm/yyyy
 *  2. dd/mm/yy
 *  3. "2 de enero"
 *  4. "4 de abril de 2026"
 *  5. hoy, ayer, anteayer, mañana, la semana pasada
 *  6. Sin fecha → fecha actual
 */

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4,
  mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

/**
 * Formatea una fecha como dd/mm/yyyy.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Extrae la fecha del texto.
 * @param {string} text
 * @returns {string} Fecha en formato dd/mm/yyyy
 */
export function parseDate(text) {
  const lower = text.toLowerCase().trim();
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));

  // 1. dd/mm/yyyy
  const fullDatePattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/;
  const fullMatch = text.match(fullDatePattern);
  if (fullMatch) {
    const [, dd, mm, yyyy] = fullMatch;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }

  // 2. dd/mm/yy
  const shortDatePattern = /\b(\d{1,2})\/(\d{1,2})\/(\d{2})\b/;
  const shortMatch = text.match(shortDatePattern);
  if (shortMatch) {
    const [, dd, mm, yy] = shortMatch;
    const yyyy = `20${yy}`;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }

  // 3 & 4. "X de mes [de año]"
  const verboseDatePattern = /\b(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?\b/i;
  const verboseMatch = lower.match(verboseDatePattern);
  if (verboseMatch) {
    const day = parseInt(verboseMatch[1], 10);
    const monthName = verboseMatch[2];
    const monthNum = MONTHS[monthName];
    if (monthNum) {
      const year = verboseMatch[3] ? parseInt(verboseMatch[3], 10) : today.getFullYear();
      const date = new Date(year, monthNum - 1, day);
      return formatDate(date);
    }
  }

  // 5. Palabras clave relativas
  if (/\bla semana pasada\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return formatDate(d);
  }

  if (/\banteayer\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return formatDate(d);
  }

  if (/\buyer\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }

  if (/\bmañana\b/.test(lower)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }

  if (/\bhoy\b/.test(lower)) {
    return formatDate(today);
  }

  // 6. Sin fecha → fecha actual
  return formatDate(today);
}
