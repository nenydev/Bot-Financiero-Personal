/**
 * sheets.js
 * Responsabilidad: interactuar con Google Sheets API.
 * Usa una Service Account para autenticación.
 */

import { google } from 'googleapis';
import { config } from '../config.js';

let sheetsClient = null;

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
 */
export async function getMovimientos() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: `${config.google.sheetName}!A2:E`,
  });

  const rows = res.data.values || [];

  return rows.map((row) => ({
    fecha: row[0] || '',
    medioPago: row[1] || '',
    tipo: row[2] || '',
    monto: parseInt(row[3], 10) || 0,
    detalle: row[4] || '',
  }));
}

/**
 * Elimina un movimiento del Sheet buscándolo por sus valores.
 * @param {{ fecha: string, tipo: string, monto: number, detalle: string }} movimiento
 */
export async function deleteMovimiento(movimiento) {
  const sheets = await getSheetsClient();

  // Obtener todas las filas para encontrar el índice exacto
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: `${config.google.sheetName}!A:E`,
  });

  const rows = res.data.values || [];

  // Buscar la fila que coincida con el movimiento (de abajo hacia arriba)
  let rowIndex = -1;
  for (let i = rows.length - 1; i >= 1; i--) {
    const row = rows[i];
    const fechaMatch = (row[0] || '').replace("'", '') === movimiento.fecha.replace("'", '');
    const tipoMatch = (row[2] || '') === movimiento.tipo;
    const montoMatch = parseInt(row[3], 10) === movimiento.monto;
    const detalleMatch = (row[4] || '') === movimiento.detalle;

    if (fechaMatch && tipoMatch && montoMatch && detalleMatch) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('No se encontró el movimiento en el Sheet.');
  }

  // Obtener el sheetId
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: config.google.spreadsheetId,
  });

  const sheetId = spreadsheet.data.sheets.find(
    (s) => s.properties.title === config.google.sheetName
  )?.properties.sheetId;

  if (sheetId === undefined) {
    throw new Error('No se encontró la hoja en el Spreadsheet.');
  }

  // Eliminar la fila
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.google.spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  console.log(`[SHEETS] ✅ Movimiento eliminado en fila ${rowIndex + 1}`);
}