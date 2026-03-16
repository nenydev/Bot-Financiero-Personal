// ============================================================
// services/scheduler.js — Envíos automáticos de resúmenes y PDF
// ============================================================

import { getMovimientos, getEnvios } from './sheets.js';
import { generarResumen, getRango } from '../core/resumen.js';
import { generarPDF } from './pdf.js';
import { enviarReportePorEmail } from './mailer.js';
import { config, WHITELIST } from '../config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

// Registro de últimos envíos para evitar duplicados
const ultimoEnvio = {
  semanal: null,
  mensual: null,
  pdf: null,
};

async function enviarATodos(texto) {
  for (const usuario of WHITELIST) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: usuario.id, text: texto }),
    });
  }
}

async function enviarDocumentATodos(pdfBuffer, mes) {
  for (const usuario of WHITELIST) {
    const formData = new FormData();
    formData.append('chat_id', String(usuario.id));
    formData.append('caption', `📄 Reporte mensual — ${mes}`);
    formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), `reporte-${mes}.pdf`);

    await fetch(`${TELEGRAM_API}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
  }
}

async function enviarResumen(periodo) {
  const ahora = new Date();
  const claveMinuto = `${ahora.getUTCFullYear()}-${ahora.getUTCMonth()}-${ahora.getUTCDate()}-${ahora.getUTCHours()}-${ahora.getUTCMinutes()}`;

  if (ultimoEnvio[periodo] === claveMinuto) {
    console.log(`[SCHEDULER] ⚠️ Resumen ${periodo} ya enviado en este minuto, ignorando.`);
    return;
  }

  ultimoEnvio[periodo] = claveMinuto;

  try {
    const movimientos = await getMovimientos();
    const rango = getRango(periodo);
    const texto = generarResumen(movimientos, rango.titulo, rango.desde, rango.hasta);
    await enviarATodos(texto);
    console.log(`[SCHEDULER] ✅ Resumen ${periodo} enviado`);
  } catch (err) {
    console.error(`[SCHEDULER] ❌ Error enviando resumen ${periodo}:`, err.message);
  }
}

/**
 * Extrae los datos del mes actual y genera el PDF buffer.
 * Exportado para uso manual desde telegram.js
 */
export async function generarPDFBuffer() {
  const fecha = new Date();
  const mes = fecha.toLocaleString('es-CL', { month: 'long', year: 'numeric', timeZone: 'America/Santiago' });
  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const hoy = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Santiago' }));

  const movimientos = await getMovimientos();
  const envios = await getEnvios();

  const movimientosMes = movimientos.filter((m) => {
    const [d, mo, a] = m.fecha.replace("'", '').split('/');
    const f = new Date(parseInt(a), parseInt(mo) - 1, parseInt(d));
    return f >= primerDiaMes && f <= hoy;
  });

  const enviosMes = envios.filter((e) => {
    const [d, mo, a] = e.fecha.replace("'", '').split('/');
    const f = new Date(parseInt(a), parseInt(mo) - 1, parseInt(d));
    return f >= primerDiaMes && f <= hoy;
  });

  const pdfBuffer = await generarPDF(movimientosMes, enviosMes, mes);
  return { pdfBuffer, mes };
}

async function enviarReportePDF() {
  const ahora = new Date();
  const claveMinuto = `${ahora.getUTCFullYear()}-${ahora.getUTCMonth()}-${ahora.getUTCDate()}-${ahora.getUTCHours()}-${ahora.getUTCMinutes()}`;

  if (ultimoEnvio.pdf === claveMinuto) {
    console.log('[SCHEDULER] ⚠️ PDF ya enviado en este minuto, ignorando.');
    return;
  }

  ultimoEnvio.pdf = claveMinuto;

  try {
    const { pdfBuffer, mes } = await generarPDFBuffer();

    // Enviar por Telegram a todos
    await enviarDocumentATodos(pdfBuffer, mes);
    console.log('[SCHEDULER] ✅ PDF enviado por Telegram');

    // Enviar por email a destinatarios configurados
    console.log('[SCHEDULER] Intentando enviar por email...');
    await enviarReportePorEmail(pdfBuffer, mes);
    console.log('[SCHEDULER] ✅ PDF enviado por email');

  } catch (err) {
    console.error('[SCHEDULER] ❌ Error enviando PDF:', err.message);
    console.error('[SCHEDULER] Stack:', err.stack);
  }
}

/**
 * Inicia el scheduler. Revisa cada minuto si hay que enviar algo.
 * Domingo 9pm Chile = Lunes 1am UTC
 * Último día del mes 9pm Chile = 1am UTC → resumen de texto
 * Último día del mes 9:05pm Chile = 1:05am UTC → PDF
 */
export function startScheduler() {
  setInterval(() => {
    const ahora = new Date();
    const horaUTC = ahora.getUTCHours();
    const minUTC = ahora.getUTCMinutes();
    const diaSemana = ahora.getUTCDay();
    const diaDelMes = ahora.getUTCDate();
    const ultimoDia = new Date(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0).getUTCDate();

    if (diaSemana === 1 && horaUTC === 1 && minUTC === 0) {
      enviarResumen('semanal');
    }

    if (diaDelMes === ultimoDia && horaUTC === 1 && minUTC === 0) {
      enviarResumen('mensual');
    }

    if (diaDelMes === ultimoDia && horaUTC === 1 && minUTC === 5) {
      enviarReportePDF();
    }

  }, 60 * 1000);

  console.log('[SCHEDULER] ✅ Scheduler iniciado');
}

/**
 * Genera y envía el reporte PDF a todos (automático fin de mes).
 */
export async function generarYEnviarReporte() {
  await enviarReportePDF();
}