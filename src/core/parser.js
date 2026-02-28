/**
 * parser.js
 * Orquestador del parseo de mensajes financieros.
 * Este módulo es completamente independiente del canal (Telegram, WhatsApp, etc.)
 *
 * Recibe texto plano y devuelve un objeto estructurado con:
 *  - fecha
 *  - tipo
 *  - monto
 *  - detalle
 *  - error (si aplica)
 */

import { parseAmount } from './amountParser.js';
import { parseDate } from './dateParser.js';
import { detectType } from './typeDetector.js';
import { parsePayment } from './paymentParser.js';

/**
 * @typedef {Object} ParseResult
 * @property {boolean} success
 * @property {string} [fecha]
 * @property {string} [tipo]
 * @property {number} [monto]
 * @property {string} [detalle]
 * @property {string} [error]
 */

/**
 * Parsea un mensaje de texto y extrae los datos financieros.
 * @param {string} text - Mensaje original del usuario
 * @returns {ParseResult}
 */
export function parseMessage(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return { success: false, error: 'El mensaje está vacío.' };
  }

  // 1. Detectar monto (obligatorio)
  const monto = parseAmount(text);
  if (monto === null) {
    return { success: false, error: 'No pude identificar el monto.' };
  }

  // 2. Detectar tipo
  const tipo = detectType(text);

  // 3. Detectar fecha
  const fecha = parseDate(text);

  // 4. Detalle = mensaje original completo
  const detalle = text.trim();

  // 5. Detectar medio de pago (opcional)
  const medioPago = parsePayment(rawText);

  

  return {
    success: true,
    error: null,
    fecha,
    tipo,
    monto,
    medioPago,
    detalle,
  };
}
