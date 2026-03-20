/**
 * config.js
 * Configuración central del bot.
 * Aquí se define la whitelist de usuarios autorizados.
 */

import 'dotenv/config';

// ============================================================
// WHITELIST: Agrega aquí los Telegram user IDs y emails.
// Para obtener tu user ID, usa el bot @userinfobot en Telegram.
// El email es opcional — solo necesario para /reporte_email
// ============================================================
export const WHITELIST = [
  { id: 5966834377, nombre: 'Henry', email: 'nenydev@gmail.com' },
  { id: 8368683187, nombre: 'Andres', email: 'almirante2004@gmail.com' },
  { id: 8488722233, nombre: 'Kiara', email: 'beniteskiara2@gmail.com' },

];

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    webhookPath: '/webhook/telegram',
  },
  google: {
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    sheetName: 'Movimientos',
  },
  port: process.env.PORT || 3000,
};

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

/**
 * Retorna el usuario de la whitelist por su ID.
 */
export function getUsuario(userId) {
  return WHITELIST.find((u) => u.id === userId) || null;
}