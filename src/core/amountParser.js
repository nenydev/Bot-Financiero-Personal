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
  console.log('[AMOUNT] Texto a parsear:', lower);


  // Primero evaluar patrones compuestos (lucas, mil, k) antes que número simple

  // "4 lucas" / "4 lukas"
  const lucasMatch = lower.match(/\b(\d+(?:[.,]\d{3})?)\s*(?:lucas|lukas)\b/);
  console.log('[AMOUNT] Lucas match:', lucasMatch);
  if (lucasMatch) return normalizeNumber(lucasMatch[1]) * 1000;

  // "4 mil" / "4mil"
  const milMatch = lower.match(/\b(\d+(?:[.,]\d{3})?)\s*mil\b/i);
  if (milMatch) return normalizeNumber(milMatch[1]) * 1000;

  // "4k" / "4K"
  const kMatch = lower.match(/\b(\d+(?:[.,]\d{3})?)\s*k\b/i);
  if (kMatch) return normalizeNumber(kMatch[1]) * 1000;

  // "20.000" / "20,000"
  const thousandsMatch = text.match(/\b(\d{1,3}(?:[.,]\d{3})+)\b/);
  if (thousandsMatch) return normalizeNumber(thousandsMatch[1]);

  // Número entero simple: 20000
  const plainMatch = text.match(/\b(\d+)\b/);
  if (plainMatch) return parseInt(plainMatch[1], 10);

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
