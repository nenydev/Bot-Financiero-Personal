// ============================================================
// services/mailer.js — Envía email via Gmail API (HTTP, sin SMTP)
// ============================================================

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

function crearMensajeBase64(destinatarios, remitente, asunto, texto, pdfBuffer, nombreArchivo) {
  const boundary = 'boundary_bot_financiero';

  const mensaje = [
    `From: "Bot Financiero" <${remitente}>`,
    `To: ${destinatarios.join(', ')}`,
    `Subject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    texto,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${nombreArchivo}"`,
    `Content-Disposition: attachment; filename="${nombreArchivo}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    pdfBuffer.toString('base64'),
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  return Buffer.from(mensaje).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function enviarReportePorEmail(pdfBuffer, mes, destinatariosExtra = []) {
  const destinatarios = destinatariosExtra.length > 0
    ? destinatariosExtra
    : process.env.GMAIL_RECIPIENTS?.split(',').map((e) => e.trim()) || [];

  if (destinatarios.length === 0) {
    console.warn('[MAILER] ⚠️ No hay destinatarios configurados');
    return;
  }

  const nombreArchivo = `reporte-${mes.toLowerCase().replace(' ', '-')}.pdf`;
  const asunto = `Reporte Financiero — ${mes}`;
  const texto = `Adjunto encontrarás el reporte financiero del mes de ${mes}.`;

  const raw = crearMensajeBase64(
    destinatarios,
    process.env.GMAIL_USER,
    asunto,
    texto,
    pdfBuffer,
    nombreArchivo
  );

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  console.log(`[MAILER] ✅ Reporte enviado a: ${destinatarios.join(', ')}`);
}