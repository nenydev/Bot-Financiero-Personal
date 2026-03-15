// ============================================================
// core/paymentParser.js — Detecta la fuente del movimiento
// ============================================================
// Fuentes posibles:
//   - Cuenta: transferencias, pagos con tarjeta, débito, crédito
//   - Efectivo: pagos en cash
//   - Punto: ingresos por el punto de venta del local (solo Ingresos)
// ============================================================

const CUENTA_KEYWORDS = [
  'transferí', 'transferi',
  'transferencia',
  'transferido',
  'me transfirieron', 'nos transfirieron',
  'por transferencia',
  'le mandé', 'le mande',
  'me mandaron',
  'bancoestado', 'banco estado',
  'banco de chile', 'banco chile',
  'bci',
  'scotiabank',
  'santander',
  'itaú', 'itau',
  'falabella',
  'ripley',
  'security',
  'consorcio',
  'deposité', 'deposite',
  'me depositaron',
  'depósito', 'deposito',
  'tarjeta',
  'con tarjeta',
  'débito', 'debito',
  'crédito', 'credito',
  'pasé la tarjeta', 'pase la tarjeta',
  'pasaron la tarjeta',
];

const EFECTIVO_KEYWORDS = [
  'efectivo',
  'cash',
  'en mano',
  'de mano en mano',
  'billetes',
  'monedas',
  'en efectivo',
];

const PUNTO_KEYWORDS = [
  'por punto',
  'por caja',
  'en caja',
  'punto',
];

/**
 * Detecta la fuente del movimiento en un texto.
 * @param {string} text
 * @param {string} tipo - 'Ingreso' o 'Gasto'
 * @returns {'Cuenta'|'Efectivo'|'Punto'|null}
 * Retorna null si no se detecta — el bot preguntará al usuario.
 */
export function parsePayment(text, tipo) {
  const normalized = text.toLowerCase();

  // Punto solo aplica a Ingresos
  if (tipo === 'Ingreso' && PUNTO_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Punto';
  }

  if (CUENTA_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Cuenta';
  }

  if (EFECTIVO_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Efectivo';
  }

  return null;
}