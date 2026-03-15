// ============================================================
// services/scheduler.js — Envíos automáticos de resúmenes
// ============================================================

import { getMovimientos } from './sheets.js';
import { generarResumen, getRango } from '../core/resumen.js';
import { config, WHITELIST } from '../config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

// Registro de últimos envíos para evitar duplicados
const ultimoEnvio = {
  semanal: null,
  mensual: null,
};

async function enviarATodos(texto) {
  for (const userId of WHITELIST) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: userId, text: texto }),
    });
  }
}

async function enviarResumen(periodo) {
  // Evitar envío duplicado en el mismo minuto
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
 * Inicia el scheduler. Revisa cada minuto si hay que enviar algo.
 * Domingo 9pm Chile = Lunes 1am UTC
 * Último día del mes 9pm Chile = 1am UTC
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
  }, 60 * 1000);

  console.log('[SCHEDULER] ✅ Scheduler iniciado');
}