/**
 * typeDetector.js
 * Responsabilidad: detectar si el movimiento es un GASTO o INGRESO.
 *
 * Lógica:
 *  - Si el texto contiene verbos de gasto → GASTO
 *  - Si hay monto pero no verbo de gasto → INGRESO
 */

// Verbos y palabras que indican gasto
const EXPENSE_KEYWORDS = [
  'gasté', 'gaste',
  'pagué', 'pague',
  'compré', 'compre',
  'transferí', 'transferi',
  'envié', 'envie',
  'salió', 'salio',
  'débito', 'debito',
  'debitó', 'debito',
  'invertí', 'inverti',
  'pagado',
  'gasto',
  'pago',
  'compra',
  'debit',
  'cargo',
];

/**
 * Detecta el tipo de movimiento.
 * @param {string} text
 * @returns {'Gasto'|'Ingreso'}
 */
export function detectType(text) {
  const lower = text.toLowerCase();

  for (const keyword of EXPENSE_KEYWORDS) {
    // Buscar la keyword como palabra completa o con acentos normalizados
    if (lower.includes(keyword)) {
      return 'Gasto';
    }
  }

  return 'Ingreso';
}
