/**
 * sheets.js
 * Responsabilidad: interactuar con Google Sheets API.
 * Usa una Service Account para autenticación.
 */

import { google } from 'googleapis';
import { config } from '../config.js';

let sheetsClient = null;

/**
 * Inicializa y retorna el cliente autenticado de Google Sheets.
 * Usa lazy initialization para no reconectar en cada request.
 * @returns {import('googleapis').sheets_v4.Sheets}
 */
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  let credentials;
  try {
    credentials = JSON.parse(config.google.serviceAccountJson.replace(/\\n/g, '\n'));
  } catch (err) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Agrega una fila con el movimiento financiero al Google Sheet.
 * @param {{ fecha: string, tipo: string, monto: number, detalle: string }} data
 * @returns {Promise<void>}
 */
export async function appendMovement(data) {
  const sheets = await getSheetsClient();
  const { fecha, tipo, monto, detalle } = data;

  const row = [fecha, tipo, monto, detalle];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.google.spreadsheetId,
      range: `${config.google.sheetName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    console.log(`[SHEETS] ✅ Movimiento guardado: ${tipo} ${monto} el ${fecha}`);
  } catch (err) {
    console.error('[SHEETS] ❌ Error al escribir en Google Sheets:', err.message);
    throw new Error('No se pudo guardar el movimiento en Google Sheets.');
  }
}
