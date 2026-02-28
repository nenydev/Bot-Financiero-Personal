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

  } catch (err) {
    throw new Error('No se pudo guardar el movimiento en Google Sheets.');
  }
}

export async function formatSheet() {
  const sheets = await getSheetsClient();

  // Obtener el ID de la hoja
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: config.google.spreadsheetId,
  });

  const sheetId = spreadsheet.data.sheets.find(
    (s) => s.properties.title === config.google.sheetName
  )?.properties.sheetId;

  if (sheetId === undefined) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.google.spreadsheetId,
    requestBody: {
      requests: [
        // Encabezados en verde oscuro con texto blanco
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.13, green: 0.37, blue: 0.22 },
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 }, fontSize: 11 },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat',
          },
        },
        // Ancho de columnas
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 100 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },
        { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 400 }, fields: 'pixelSize' } },
        // Filas alternas en gris claro
        {
          addConditionalFormatRule: {
            rule: {
              ranges: [{ sheetId, startRowIndex: 1, endRowIndex: 1000 }],
              booleanRule: {
                condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=ISEVEN(ROW())' }] },
                format: { backgroundColor: { red: 0.94, green: 0.94, blue: 0.94 } },
              },
            },
            index: 0,
          },
        },
      ],
    },
  });

  console.log('[SHEETS] ✅ Formato aplicado');
}