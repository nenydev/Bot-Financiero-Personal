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

const TARJETA_KEYWORDS = [
  'tarjeta',
  'con tarjeta',
  'débito', 'debito',
  'crédito', 'credito',
  'punto de venta',
  'punto',
  'por caja',
  'en caja',
  'pasé la tarjeta', 'pase la tarjeta',
  'pasaron la tarjeta',
];

/**
 * Detecta el medio de pago en un texto.
 * @param {string} text
 * @returns {'Transferencia'|'Efectivo'|'Tarjeta/Punto'|'No especificado'}
 */
export function parsePayment(text) {
  const normalized = text.toLowerCase();

  if (TRANSFERENCIA_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Transferencia';
  }

  if (EFECTIVO_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Efectivo';
  }

  if (TARJETA_KEYWORDS.some((k) => normalized.includes(k))) {
    return 'Tarjeta/Punto';
  }

  return 'No especificado';
}