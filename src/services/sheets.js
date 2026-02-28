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
  console.log('[DEBUG] Primeros 50 chars:', config.google.serviceAccountJson?.substring(0, 50));
  try {
    const json = config.google.serviceAccountJson.replace(/\\n/g, '\n');
    credentials = JSON.parse(json);
  } catch (err) {
    console.error('[DEBUG] Error exacto del parse:', err.message);
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  console.log('[DEBUG] Auth creado, obteniendo cliente Sheets...');

  sheetsClient = google.sheets({ version: 'v4', auth });
  console.log('[DEBUG] Cliente Sheets listo');
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
    console.log('[DEBUG] SpreadsheetId:', config.google.spreadsheetId);
    console.log('[DEBUG] SheetName:', config.google.sheetName);
    console.log('[DEBUG] Llamando a Sheets API...');
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
    console.error('[SHEETS] Error completo:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    throw new Error('No se pudo guardar el movimiento en Google Sheets.');
  }
}
