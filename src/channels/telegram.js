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
import { appendMovement, getMovimientos } from '../services/sheets.js';
import { generarResumen, generarUltimosMovimientos, getRango } from '../core/resumen.js';

// Estado temporal de conversaciones (se resetea si el servidor reinicia)
const conversationState = new Map();

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.token}`;

/**
 * Envía un mensaje de texto a un chat de Telegram.
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
 */
export async function handleTelegramWebhook(req, res) {
  // Responder 200 inmediatamente para que Telegram no reintente
  res.sendStatus(200);

  const body = req.body;

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
    await handleCommand(chatId, userId, text.toLowerCase().trim());
    return;
  }

  // 3. Manejar respuesta de período si el usuario está en medio de un /resumen
  if (conversationState.get(userId) === 'esperando_periodo') {
    const opciones = {
      '1': 'semanal', '2': 'mensual', '3': 'trimestral', '4': 'semestral', '5': 'anual',
      'semanal': 'semanal', 'mensual': 'mensual', 'trimestral': 'trimestral',
      'semestral': 'semestral', 'anual': 'anual',
    };

    const periodo = opciones[text.toLowerCase().trim()];

    if (periodo) {
      conversationState.delete(userId);
      try {
        const movimientos = await getMovimientos();
        const rango = getRango(periodo);
        const respuesta = generarResumen(movimientos, rango.titulo, rango.desde, rango.hasta);
        await sendReply(chatId, respuesta);
      } catch (err) {
        console.error('[TELEGRAM] Error generando resumen:', err.message);
        await sendReply(chatId, '❌ Error al generar el resumen.');
      }
    } else {
      await sendReply(chatId, 'Responde con un número del 1 al 5 o escribe el período (semanal, mensual, trimestral, semestral, anual).');
    }
    return;
  }

  // 4. Parsear el mensaje financiero
  const parsed = parseMessage(text);

  if (!parsed.success) {
    console.log(`[TELEGRAM] Parse fallido para "${text}": ${parsed.error}`);
    await sendReply(chatId, `❌ ${parsed.error}`);
    return;
  }

  // 5. Guardar en Google Sheets
  try {
    await appendMovement(parsed);
  } catch (err) {
    console.error('[TELEGRAM] Error guardando movimiento:', err.message);
    await sendReply(chatId, '❌ Error al guardar el movimiento. Intenta más tarde.');
    return;
  }

  // 6. Confirmar al usuario
  const reply = `✅ Movimiento registrado: ${parsed.tipo} de ${parsed.monto} el ${parsed.fecha} — ${parsed.medioPago}`;
  await sendReply(chatId, reply);
}

/**
 * Maneja comandos que empiezan con /
 */
async function handleCommand(chatId, userId, text) {
  // /movimientos
  if (text === '/movimientos') {
    try {
      const movimientos = await getMovimientos();
      const respuesta = generarUltimosMovimientos(movimientos, 10);
      await sendReply(chatId, respuesta);
    } catch (err) {
      console.error('[TELEGRAM] Error obteniendo movimientos:', err.message);
      await sendReply(chatId, '❌ Error al obtener los movimientos.');
    }
    return;
  }

  // /resumen con período directo: /resumen mensual
  const matchDirecto = text.match(/^\/resumen\s+(semanal|mensual|trimestral|semestral|anual)$/);
  if (matchDirecto) {
    try {
      const periodo = matchDirecto[1];
      const movimientos = await getMovimientos();
      const rango = getRango(periodo);
      const respuesta = generarResumen(movimientos, rango.titulo, rango.desde, rango.hasta);
      await sendReply(chatId, respuesta);
    } catch (err) {
      console.error('[TELEGRAM] Error generando resumen:', err.message);
      await sendReply(chatId, '❌ Error al generar el resumen.');
    }
    return;
  }

  // /resumen sin período → preguntar
  if (text === '/resumen') {
    conversationState.set(userId, 'esperando_periodo');
    await sendReply(
      chatId,
      '¿Qué período quieres consultar?\n\n' +
      '1️⃣ Semanal\n' +
      '2️⃣ Mensual\n' +
      '3️⃣ Trimestral\n' +
      '4️⃣ Semestral\n' +
      '5️⃣ Anual'
    );
    return;
  }

  // Comando no reconocido
  await sendReply(
    chatId,
    '❓ Comandos disponibles:\n\n' +
    '/resumen — resumen financiero\n' +
    '/movimientos — últimos 10 movimientos'
  );
}