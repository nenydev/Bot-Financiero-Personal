// ============================================================
// core/paymentParser.js — Detecta el medio de pago
// ============================================================

const TRANSFERENCIA_KEYWORDS = [
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
 * Detecta el medio de pago en un texto.
 * @param {string} text
 * @returns {'Transferencia'|'Efectivo'|'Punto'|null}
 * Retorna null si no se detecta — el bot preguntará al usuario.
 */
export function parsePayment(text) {
  const normalized = text.toLowerCase();

  if (PUNTO_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Punto';
  }

  if (TRANSFERENCIA_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Transferencia';
  }

  if (EFECTIVO_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Efectivo';
  }

  return null;
}