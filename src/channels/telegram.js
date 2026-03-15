/**
 * telegram.js
 * Responsabilidad: manejar la comunicación con la API de Telegram.
 */

import { WHITELIST, config } from '../config.js';
import { parseMessage } from '../core/parser.js';
import { esEnvio } from '../core/envioParser.js';
import { parseAmount } from '../core/amountParser.js';
import { parseDate, formatDate } from '../core/dateParser.js';
import {
  appendMovement,
  getMovimientos,
  deleteMovimiento,
  appendEnvio,
  getEnvios,
} from '../services/sheets.js';
import {
  generarResumen,
  generarResumenHistorico,
  generarResumenHoy,
  generarBalance,
  generarUltimosMovimientos,
  getRango,
  generarResumenEnvios,
} from '../core/resumen.js';

const conversationState = new Map();
const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

async function sendReply(chatId, text) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('[TELEGRAM] ❌ Error enviando mensaje:', err.message);
  }
}

export async function handleTelegramWebhook(req, res) {
  res.sendStatus(200);

  const body = req.body;
  const message = body?.message;
  if (!message || !message.text) return;

  const userId = message.from?.id;
  const chatId = message.chat?.id;
  const text = message.text.trim();
  const username = message.from?.username || message.from?.first_name || userId;

  console.log(`[TELEGRAM] Mensaje de ${username} (${userId}): "${text}"`);

  // 1. Validar whitelist
  if (!WHITELIST.includes(userId)) {
    console.warn(`[TELEGRAM] ⛔ Usuario no autorizado: ${userId}`);
    await sendReply(chatId, '⛔ No estás autorizado para usar este bot.');
    return;
  }

  // 2. Detectar comandos
  if (text.startsWith('/')) {
    await handleCommand(chatId, userId, text.toLowerCase());
    return;
  }

  // 3. Manejar estados de conversación activos
  const estado = conversationState.get(userId);

  if (estado === 'borrar_seleccion') {
    await handleBorrarSeleccion(chatId, userId, text);
    return;
  }

  if (estado?.startsWith('borrar_confirmar:')) {
    await handleBorrarConfirmacion(chatId, userId, text, estado);
    return;
  }

  if (estado?.startsWith('esperando_medio_pago:')) {
    await handleMedioPago(chatId, userId, text, estado);
    return;
  }

  // 4. Detectar si es un envío
  if (esEnvio(text)) {
    const monto = parseAmount(text);
    if (!monto) {
      await sendReply(chatId, '❌ No pude identificar el monto del envío.');
      return;
    }

    const fecha = parseDate(text);

    try {
      await appendEnvio({ fecha, monto, detalle: text });
      await sendReply(chatId, `📦 Envío registrado: $${monto.toLocaleString('es-CL')} — ${text}`);
    } catch (err) {
      console.error('[TELEGRAM] Error guardando envío:', err.message);
      await sendReply(chatId, '❌ Error al guardar el envío. Intenta más tarde.');
    }
    return;
  }

  // 5. Parsear mensaje financiero
  const parsed = parseMessage(text);

  if (!parsed.success) {
    await sendReply(chatId, `❌ ${parsed.error}`);
    return;
  }

  // 6. Si no se detectó medio de pago, preguntar
  if (!parsed.medioPago) {
    conversationState.set(userId, `esperando_medio_pago:${JSON.stringify(parsed)}`);
    await sendReply(
      chatId,
      `✅ Monto detectado: $${parsed.monto.toLocaleString('es-CL')} — ${parsed.tipo}\n\n` +
      `¿Cuál fue el medio de pago?\n\n` +
      `1️⃣ Efectivo\n` +
      `2️⃣ Transferencia\n` +
      `3️⃣ Punto`
    );
    return;
  }

  // 7. Guardar directamente si ya tiene medio de pago
  try {
    await appendMovement(parsed);
  } catch (err) {
    console.error('[TELEGRAM] Error guardando movimiento:', err.message);
    await sendReply(chatId, '❌ Error al guardar el movimiento. Intenta más tarde.');
    return;
  }

  await sendReply(chatId, `✅ Movimiento registrado: ${parsed.tipo} de $${parsed.monto.toLocaleString('es-CL')} el ${parsed.fecha} — ${parsed.medioPago}`);
}

async function handleMedioPago(chatId, userId, text, estado) {
  const opciones = {
    '1': 'Efectivo',
    '2': 'Transferencia',
    '3': 'Punto',
    'efectivo': 'Efectivo',
    'transferencia': 'Transferencia',
    'punto': 'Punto',
  };

  const medioPago = opciones[text.toLowerCase().trim()];

  if (!medioPago) {
    await sendReply(chatId, 'Responde con 1, 2 o 3:\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Punto');
    return;
  }

  const parsedJson = estado.replace('esperando_medio_pago:', '');
  const parsed = JSON.parse(parsedJson);
  parsed.medioPago = medioPago;

  conversationState.delete(userId);

  try {
    await appendMovement(parsed);
    await sendReply(chatId, `✅ Movimiento registrado: ${parsed.tipo} de $${parsed.monto.toLocaleString('es-CL')} el ${parsed.fecha} — ${medioPago}`);
  } catch (err) {
    console.error('[TELEGRAM] Error guardando movimiento:', err.message);
    await sendReply(chatId, '❌ Error al guardar el movimiento. Intenta más tarde.');
  }
}

async function handleCommand(chatId, userId, text) {

  // /ayuda
  if (text === '/ayuda') {
    await sendReply(chatId,
      '🤖 Comandos disponibles:\n\n' +
      '📊 Resúmenes financieros:\n' +
      '/hoy — movimientos de hoy\n' +
      '/semanal — últimos 7 días\n' +
      '/mensual — mes actual\n' +
      '/trimestral — últimos 3 meses\n' +
      '/semestral — últimos 6 meses\n' +
      '/anual — año actual\n' +
      '/historico — todos los movimientos\n\n' +
      '💳 Consultas:\n' +
      '/balance — balance del mes actual\n' +
      '/movimientos — últimos 10 movimientos\n' +
      '/ultimo — último movimiento registrado\n\n' +
      '📦 Envíos:\n' +
      '/envios_semanal — envíos de los últimos 7 días\n' +
      '/envios_mensual — envíos del mes actual\n' +
      '/envios_anual — envíos del año actual\n\n' +
      '🗑️ Eliminar:\n' +
      '/borrar — eliminar un movimiento\n\n' +
      '📝 Para registrar un movimiento escribe en lenguaje natural:\n' +
      '"gasté 20 lucas en supermercado"\n' +
      '"me transfirieron 150k de sueldo"\n' +
      '"pagué 45.000 con tarjeta ayer"\n\n' +
      '📦 Para registrar un envío:\n' +
      '"envio 5 lucas ramo a maipu"\n' +
      '"enviamos 8000 flores a santiago"'
    );
    return;
  }

  // /hoy
  if (text === '/hoy') {
    try {
      const movimientos = await getMovimientos();
      await sendReply(chatId, generarResumenHoy(movimientos));
    } catch {
      await sendReply(chatId, '❌ Error al obtener los movimientos.');
    }
    return;
  }

  // /balance
  if (text === '/balance') {
    try {
      const movimientos = await getMovimientos();
      await sendReply(chatId, generarBalance(movimientos));
    } catch {
      await sendReply(chatId, '❌ Error al obtener el balance.');
    }
    return;
  }

  // /movimientos
  if (text === '/movimientos') {
    try {
      const movimientos = await getMovimientos();
      await sendReply(chatId, generarUltimosMovimientos(movimientos, 10));
    } catch {
      await sendReply(chatId, '❌ Error al obtener los movimientos.');
    }
    return;
  }

  // /ultimo
  if (text === '/ultimo') {
    try {
      const movimientos = await getMovimientos();
      if (movimientos.length === 0) {
        await sendReply(chatId, '📋 No hay movimientos registrados.');
        return;
      }
      const ultimo = movimientos[movimientos.length - 1];
      await sendReply(
        chatId,
        `📋 Último movimiento:\n\n` +
        `• ${ultimo.fecha.replace("'", '')} — ${ultimo.tipo} $${ultimo.monto.toLocaleString('es-CL')}\n` +
        `  ${ultimo.detalle}\n` +
        `  Medio de pago: ${ultimo.medioPago}`
      );
    } catch {
      await sendReply(chatId, '❌ Error al obtener el último movimiento.');
    }
    return;
  }

  // /historico
  if (text === '/historico') {
    try {
      const movimientos = await getMovimientos();
      await sendReply(chatId, generarResumenHistorico(movimientos));
    } catch {
      await sendReply(chatId, '❌ Error al obtener el historial.');
    }
    return;
  }

  // Resúmenes por período
  const periodos = ['semanal', 'mensual', 'trimestral', 'semestral', 'anual'];
  const periodo = periodos.find((p) => text === `/${p}`);
  if (periodo) {
    try {
      const movimientos = await getMovimientos();
      const rango = getRango(periodo);
      await sendReply(chatId, generarResumen(movimientos, rango.titulo, rango.desde, rango.hasta));
    } catch {
      await sendReply(chatId, '❌ Error al generar el resumen.');
    }
    return;
  }

  // Resúmenes de envíos
  const periodosEnvios = ['semanal', 'mensual', 'anual'];
  const periodoEnvio = periodosEnvios.find((p) => text === `/envios_${p}`);
  if (periodoEnvio) {
    try {
      const envios = await getEnvios();
      const rango = getRango(periodoEnvio);
      await sendReply(chatId, generarResumenEnvios(envios, rango.titulo, rango.desde, rango.hasta));
    } catch {
      await sendReply(chatId, '❌ Error al generar el resumen de envíos.');
    }
    return;
  }

  // /borrar
  if (text === '/borrar') {
    try {
      const movimientos = await getMovimientos();
      if (movimientos.length === 0) {
        await sendReply(chatId, '📋 No hay movimientos para eliminar.');
        return;
      }

      const ultimos3 = movimientos.slice(-3).reverse();
      conversationState.set(userId, 'borrar_seleccion');
      conversationState.set(`${userId}_borrar_lista`, ultimos3);

      const lista = ultimos3
        .map((m, i) => `${i + 1}. ${m.fecha.replace("'", '')} — ${m.tipo} $${m.monto.toLocaleString('es-CL')} — ${m.detalle}`)
        .join('\n');

      await sendReply(chatId, `🗑️ ¿Cuál movimiento quieres eliminar?\n\n${lista}\n\nResponde con el número (1, 2 o 3) o escribe /cancelar.`);
    } catch {
      await sendReply(chatId, '❌ Error al obtener los movimientos.');
    }
    return;
  }

  // /cancelar
  if (text === '/cancelar') {
    conversationState.delete(userId);
    conversationState.delete(`${userId}_borrar_lista`);
    await sendReply(chatId, '✅ Operación cancelada.');
    return;
  }

  // Comando no reconocido
  await sendReply(chatId, '❓ Comando no reconocido. Escribe /ayuda para ver los comandos disponibles.');
}

async function handleBorrarSeleccion(chatId, userId, text) {
  const lista = conversationState.get(`${userId}_borrar_lista`);
  const opcion = parseInt(text.trim());

  if (!lista || isNaN(opcion) || opcion < 1 || opcion > lista.length) {
    await sendReply(chatId, `Responde con un número del 1 al ${lista?.length || 3} o escribe /cancelar.`);
    return;
  }

  const movimiento = lista[opcion - 1];
  conversationState.set(userId, `borrar_confirmar:${opcion - 1}`);

  await sendReply(
    chatId,
    `⚠️ ¿Seguro que quieres eliminar este movimiento?\n\n` +
    `• ${movimiento.fecha.replace("'", '')} — ${movimiento.tipo} $${movimiento.monto.toLocaleString('es-CL')}\n` +
    `  ${movimiento.detalle}\n\n` +
    `Responde "si" para confirmar o "no" para cancelar.`
  );
}

async function handleBorrarConfirmacion(chatId, userId, text, estado) {
  const respuesta = text.toLowerCase().trim();

  if (respuesta === 'no' || respuesta === '/cancelar') {
    conversationState.delete(userId);
    conversationState.delete(`${userId}_borrar_lista`);
    await sendReply(chatId, '✅ Operación cancelada.');
    return;
  }

  if (respuesta !== 'si' && respuesta !== 'sí') {
    await sendReply(chatId, 'Responde "si" para confirmar o "no" para cancelar.');
    return;
  }

  const indice = parseInt(estado.split(':')[1]);
  const lista = conversationState.get(`${userId}_borrar_lista`);
  const movimiento = lista[indice];

  conversationState.delete(userId);
  conversationState.delete(`${userId}_borrar_lista`);

  try {
    await deleteMovimiento(movimiento);
    await sendReply(chatId, '✅ Movimiento eliminado correctamente.');
  } catch (err) {
    console.error('[TELEGRAM] Error eliminando movimiento:', err.message);
    await sendReply(chatId, '❌ Error al eliminar el movimiento.');
  }
}