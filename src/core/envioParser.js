// ============================================================
// core/envioParser.js — Detecta si un mensaje es un envío
// ============================================================

const ENVIO_KEYWORDS = [
  'envio', 'envío',
  'envié', 'envie',
  'envíe', 'envió',
  'enviamos',
];

/**
 * Detecta si el mensaje corresponde a un envío.
 * @param {string} text
 * @returns {boolean}
 */
export function esEnvio(text) {
  const lower = text.toLowerCase();
  return ENVIO_KEYWORDS.some((k) => lower.includes(k));
}