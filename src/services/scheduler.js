// ============================================================
// services/scheduler.js — Envíos automáticos de resúmenes
// ============================================================

import { getMovimientos } from './sheets.js';
import { generarResumen, getRango } from '../core/resumen.js';
import { config, WHITELIST } from '../config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

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
 * Hora Chile = UTC-4 (estándar) → 9pm Chile = 1am UTC del día siguiente
 */
export function startScheduler() {
  setInterval(() => {
    const ahora = new Date();
    const horaUTC = ahora.getUTCHours();
    const minUTC = ahora.getUTCMinutes();
    const diaSemana = ahora.getUTCDay(); // 0=domingo, 1=lunes...
    const diaDelMes = ahora.getUTCDate();
    const ultimoDia = new Date(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0).getUTCDate();

    // Domingo 9pm Chile = Lunes 1am UTC
    if (diaSemana === 1 && horaUTC === 1 && minUTC === 0) {
      enviarResumen('semanal');
    }

    // Último día del mes 9pm Chile = siguiente día 1am UTC (o mismo día si es el último)
    if (diaDelMes === ultimoDia && horaUTC === 1 && minUTC === 0) {
      enviarResumen('mensual');
    }
  }, 60 * 1000); // cada minuto

  console.log('[SCHEDULER] ✅ Scheduler iniciado');
}