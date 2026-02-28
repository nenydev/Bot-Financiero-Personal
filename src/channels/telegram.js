/**
 * telegram.js
 * Responsabilidad: manejar la comunicación con la API de Telegram.
 *
 * Esta capa solo:
 *  1. Extrae el mensaje y usuario del payload de Telegram.
 *  2. Valida el usuario contra la whitelist.
 *  3. Llama al parser (lógica de negocio independiente).
 *  4. Llama al servicio de Sheets.
 *  5. Responde al usuario via Telegram.
 *
 * NO contiene lógica de parseo ni lógica de negocio.
 *
 * ─────────────────────────────────────────────────────────────
 * MIGRACIÓN A WHATSAPP (futuro):
 *  Crear /src/channels/whatsapp.js siguiendo la misma estructura:
 *  - Extraer `userId` de `req.body.entry[0].changes[0].value.messages[0].from`
 *  - Extraer `text` de `...messages[0].text.body`
 *  - Usar la misma función `sendReply(userId, text)` pero con la API de WhatsApp Cloud
 *  - El parser y el servicio de Sheets NO cambian.
 * ─────────────────────────────────────────────────────────────
 */

import { WHITELIST, config } from '../config.js';
import { parseMessage } from '../core/parser.js';
import { appendMovement } from '../services/sheets.js';
import { getMovimientos } from '../services/sheets.js';
import { generarResumen, generarUltimosMovimientos, getRango } from '../core/resumen.js';


const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

/**
 * Envía un mensaje de texto a un chat de Telegram.
 * @param {number|string} chatId
 * @param {string} text
 */
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

/**
 * Procesa un webhook de Telegram.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleTelegramWebhook(req, res) {
  // Responder 200 inmediatamente para que Telegram no reintente
  res.sendStatus(200);

  const body = req.body;

  // Ignorar actualizaciones sin mensaje de texto
  const message = body?.message;
  if (!message || !message.text) {
    console.log('[TELEGRAM] Update sin texto, ignorando.');
    return;
  }

  const userId = message.from?.id;
  const chatId = message.chat?.id;
  const text = message.text;
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
    await handleCommand(chatId, text.toLowerCase().trim());
    return;
  }

  // 3. Parsear el mensaje (lógica 100% independiente de Telegram)
  const parsed = parseMessage(text);

  if (!parsed.success) {
    console.log(`[TELEGRAM] Parse fallido para "${text}": ${parsed.error}`);
    await sendReply(chatId, `❌ ${parsed.error}`);
    return;
  }

  // 3. Guardar en Google Sheets
  try {
    await appendMovement(parsed);
  } catch (err) {
    console.error('[TELEGRAM] Error guardando movimiento:', err.message);
    console.error('[TELEGRAM] Stack:', err.stack); // NUEVO
    await sendReply(chatId, '❌ Error al guardar el movimiento. Intenta más tarde.');
    return;
  }

  // 4. Confirmar al usuario
  const reply = `✅ Movimiento registrado: ${parsed.tipo} de ${parsed.monto} el ${parsed.fecha}`;
  await sendReply(chatId, reply);
}

async function handleCommand(chatId, text) {
  // /movimientos
  if (text === '/movimientos') {
    try {
      const movimientos = await getMovimientos();
      const respuesta = generarUltimosMovimientos(movimientos, 10);
      await sendReply(chatId, respuesta);
    } catch {
      await sendReply(chatId, '❌ Error al obtener los movimientos.');
    }
    return;
  }

  // /resumen semanal|mensual|trimestral|semestral|anual
  const match = text.match(/^\/resumen\s+(semanal|mensual|trimestral|semestral|anual)$/);
  if (match) {
    try {
      const periodo = match[1];
      const movimientos = await getMovimientos();
      const rango = getRango(periodo);
      const respuesta = generarResumen(movimientos, rango.titulo, rango.desde, rango.hasta);
      await sendReply(chatId, respuesta);
    } catch {
      await sendReply(chatId, '❌ Error al generar el resumen.');
    }
    return;
  }

  // Comando no reconocido
  await sendReply(
    chatId,
    '❓ Comandos disponibles:\n\n' +
    '/resumen semanal\n' +
    '/resumen mensual\n' +
    '/resumen trimestral\n' +
    '/resumen semestral\n' +
    '/resumen anual\n' +
    '/movimientos'
  );
}