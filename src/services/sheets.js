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
    const clean = config.google.serviceAccountJson
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    credentials = JSON.parse(clean);
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
  const { fecha, tipo, monto, medioPago, detalle } = data;

  const row = [`'${fecha}`, medioPago, tipo, monto, detalle];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.google.spreadsheetId,
      range: `${config.google.sheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'OVERWRITE',
      requestBody: {
        values: [row],
      },
    });

  } catch (err) {
    throw new Error('No se pudo guardar el movimiento en Google Sheets.');
  }
}

/**
 * Lee todos los movimientos del Sheet.
 * @returns {Promise<Array>}
 */
export async function getMovimientos() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: `${config.google.sheetName}!A2:D`,
  });

  const rows = res.data.values || [];

  return rows.map((row) => ({
    fecha: row[0] || '',
    tipo: row[1] || '',
    monto: parseInt(row[2], 10) || 0,
    detalle: row[3] || '',
  }));
}