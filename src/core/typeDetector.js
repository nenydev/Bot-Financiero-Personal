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
  // Verbos directos
  'gasté', 'gaste',
  'pagué', 'pague',
  'compré', 'compre',
  'transferí', 'transferi',
  'hice una transferencia',
  'envié', 'envie',
  'envié', 'envie',
  'salió', 'salio',
  'débito', 'debito',
  'invertí', 'inverti',
  'saqué', 'saque',
  'retiré', 'retire',
  'perdí', 'perdi',
  'presté', 'preste',
  'devolví', 'devolvi',
  'aboné', 'abone',
  'abonué', 'aboune',
  'cancelé', 'cancele',
  'deposité', 'deposite',
  'perdí', 'perdi',
  'quitó', 'quito',
  'robó', 'robo',

  // Me/nos + verbo
  'me costó', 'me costo',
  'me cobró', 'me cobro',
  'me descontaron',
  'me cargaron',
  'me quitaron',
  'nos costó', 'nos costo',
  'nos cobraron',
  'nos descontaron',
  'me robaron',
  'me multaron',

  // Se + verbo
  'se fue',
  'se fueron',
  'se gastó', 'se gasto',
  'se pagó', 'se pago',
  'salieron',
  'cargaron',
  'descontaron',
  'cobraron',

  // Sustantivos que implican gasto
  'factura',
  'cuenta',
  'cuota',
  'mensualidad',
  'arriendo',
  'alquiler',
  'multa',
  'deuda',
  'servicio',
  'servicios',
  'mercado',
  'recibo',
  'préstamo', 'prestamo',
  'interés', 'interes',
  'acabo de comprar',
  'fui a comprar',
  'salí a comprar', 'sali a comprar',
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
