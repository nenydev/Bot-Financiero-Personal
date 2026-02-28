/**
 * server.js
 * Punto de entrada de la aplicación.
 * Configura Express, monta las rutas y arranca el servidor.
 */

import 'dotenv/config';
import express from 'express';
import { config, validateConfig } from './config.js';
import { handleTelegramWebhook } from './channels/telegram.js';
import { startScheduler } from './services/scheduler.js';


// Validar configuración al iniciar
try {
  validateConfig();
} catch (err) {
  console.error('[SERVER] ❌ Error de configuración:', err.message);
  process.exit(1);
}

const app = express();

// Parsear JSON (requerido para recibir webhooks)
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────────────────────────

// Health check (útil para Render, Railway, Cloud Run)
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'financial-bot', timestamp: new Date().toISOString() });
});

// Webhook de Telegram
app.post(config.telegram.webhookPath, handleTelegramWebhook);

// Futura ruta de WhatsApp (descomentar cuando se implemente):
// import { handleWhatsAppWebhook, handleWhatsAppVerification } from './channels/whatsapp.js';
// app.get('/webhook/whatsapp', handleWhatsAppVerification);
// app.post('/webhook/whatsapp', handleWhatsAppWebhook);

// ─────────────────────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] ✅ Bot financiero corriendo en puerto ${PORT}`);
  console.log(`[SERVER] Webhook Telegram: POST /webhook/telegram`);
  startScheduler();
});

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM recibido, cerrando...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Error no capturado:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Promise rechazada:', reason);
});

export default app;
