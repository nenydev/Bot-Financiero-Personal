/**
 * amountParser.js
 * Responsabilidad: detectar y normalizar montos en texto natural.
 *
 * Formatos soportados:
 *  - 20000
 *  - 20.000
 *  - 20,000
 *  - 20k / 20K
 *  - 20 mil / 20mil
 *  - 20 lucas / 20lucas
 */

/**
 * Extrae el monto del texto y lo devuelve como entero.
 * @param {string} text
 * @returns {number|null} Monto como entero, o null si no se detecta.
 */
export function parseAmount(text) {
  const lower = text.toLowerCase().trim();

  // Patrón: número seguido de "k" → ej: 20k, 20K
  const kPattern = /\b(\d+(?:[.,]\d{3})?)\s*k\b/i;
  const kMatch = lower.match(kPattern);
  if (kMatch) {
    const base = normalizeNumber(kMatch[1]);
    return base * 1000;
  }

  // Patrón: número seguido de "mil" → ej: 20 mil, 20mil
  const milPattern = /\b(\d+(?:[.,]\d{3})?)\s*mil\b/i;
  const milMatch = lower.match(milPattern);
  if (milMatch) {
    const base = normalizeNumber(milMatch[1]);
    return base * 1000;
  }

  // Patrón: número seguido de "lucas" o "lukas" → ej: 20 lucas, 20 lukas
  const lucasPattern = /\b(\d+(?:[.,]\d{3})?)\s*luk?as?\b/i;
  const lucasMatch = lower.match(lucasPattern);
  if (lucasMatch) {
    const base = normalizeNumber(lucasMatch[1]);
    return base * 1000;
  }

  // Patrón: número con separadores de miles → ej: 20.000 o 20,000
  // Se distingue de decimales porque el grupo después del separador tiene exactamente 3 dígitos
  const thousandsPattern = /\b(\d{1,3}(?:[.,]\d{3})+)\b/;
  const thousandsMatch = text.match(thousandsPattern);
  if (thousandsMatch) {
    return normalizeNumber(thousandsMatch[1]);
  }

  // Patrón: número entero simple → ej: 20000
  const plainPattern = /\b(\d+)\b/;
  const plainMatch = text.match(plainPattern);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  return null;
}

/**
 * Normaliza un string numérico quitando separadores de miles.
 * @param {string} numStr
 * @returns {number}
 */
function normalizeNumber(numStr) {
  // Eliminar puntos y comas usados como separadores de miles
  const clean = numStr.replace(/[.,]/g, '');
  return parseInt(clean, 10);
}
