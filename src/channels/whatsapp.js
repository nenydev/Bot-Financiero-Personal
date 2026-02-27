/**
 * whatsapp.js
 * PLACEHOLDER - Futura integración con WhatsApp Cloud API.
 *
 * Para activar esta integración:
 *
 * 1. Registrarse en Meta for Developers: https://developers.facebook.com/
 * 2. Crear una App de tipo "Business".
 * 3. Agregar el producto "WhatsApp".
 * 4. Obtener el WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID.
 * 5. Configurar el webhook apuntando a /webhook/whatsapp en tu servidor.
 * 6. Implementar la verificación del webhook (GET) con VERIFY_TOKEN.
 * 7. Descomentar y completar el código de abajo.
 * 8. Registrar la ruta en server.js.
 *
 * CAMBIOS RESPECTO A TELEGRAM:
 *  - El payload del webhook tiene estructura distinta (ver extractores abajo).
 *  - El endpoint de envío es diferente (Graph API).
 *  - El user ID es el número de teléfono en lugar de un integer ID.
 *  - La whitelist debe contener números de teléfono en formato E.164 (ej: +56912345678).
 *  - El parser y el servicio de Sheets NO cambian.
 */

/*
import fetch from 'node-fetch';
import { WHITELIST, config } from '../config.js';
import { parseMessage } from '../core/parser.js';
import { appendMovement } from '../services/sheets.js';

const WHATSAPP_API = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

async function sendReply(to, text) {
  await fetch(`${WHATSAPP_API}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
}

export function handleWhatsAppVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
}

export async function handleWhatsAppWebhook(req, res) {
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message || message.type !== 'text') return;

  const userId = message.from; // Número de teléfono E.164
  const text = message.text.body;

  if (!WHITELIST.includes(userId)) {
    await sendReply(userId, '⛔ No estás autorizado para usar este bot.');
    return;
  }

  const parsed = parseMessage(text); // Mismo parser, sin cambios

  if (!parsed.success) {
    await sendReply(userId, `❌ ${parsed.error}`);
    return;
  }

  try {
    await appendMovement(parsed); // Mismo servicio, sin cambios
  } catch (err) {
    await sendReply(userId, '❌ Error al guardar el movimiento.');
    return;
  }

  await sendReply(userId, `✅ Movimiento registrado: ${parsed.tipo} de ${parsed.monto} el ${parsed.fecha}`);
}
*/

export const whatsappPlaceholder = 'Ver comentarios en este archivo para implementar WhatsApp Cloud API.';
