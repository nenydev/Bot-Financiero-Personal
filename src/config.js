/**
 * config.js
 * Configuración central del bot.
 * Aquí se define la whitelist de usuarios autorizados.
 */

import 'dotenv/config';

// ============================================================
// WHITELIST: Agrega aquí los Telegram user IDs autorizados.
// Para obtener tu user ID, usa el bot @userinfobot en Telegram.
// ============================================================
export const WHITELIST = [
  // Ejemplo: 123456789
  // Ejemplo: 987654321
  5966834377, //henry
  8368683187, //andres
];

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    webhookPath: '/webhook/telegram',
  },
  google: {
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    sheetName: 'Movimientos', // Nombre de la hoja dentro del spreadsheet
  },
  port: process.env.PORT || 3000,
};

// Validación de variables de entorno obligatorias al iniciar
export function validateConfig() {
  const required = ['TELEGRAM_BOT_TOKEN', 'GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_SPREADSHEET_ID'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  if (WHITELIST.length === 0) {
    console.warn('[CONFIG] ⚠️  WHITELIST vacía. Ningún usuario podrá usar el bot hasta agregar IDs.');
  }
}
