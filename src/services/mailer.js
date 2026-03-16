// ============================================================
// services/mailer.js — Envía el reporte PDF por email via Resend
// ============================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía el reporte mensual PDF por email.
 * @param {Buffer} pdfBuffer
 * @param {string} mes
 * @param {string[]} destinatariosExtra - Si se pasa, usa estos en lugar de GMAIL_RECIPIENTS
 */
export async function enviarReportePorEmail(pdfBuffer, mes, destinatariosExtra = []) {
  const destinatarios = destinatariosExtra.length > 0
    ? destinatariosExtra
    : process.env.GMAIL_RECIPIENTS?.split(',').map((e) => e.trim()) || [];

  if (destinatarios.length === 0) {
    console.warn('[MAILER] ⚠️ No hay destinatarios configurados');
    return;
  }

  await resend.emails.send({
    from: 'Bot Financiero <onboarding@resend.dev>',
    to: destinatarios,
    subject: `Reporte Financiero — ${mes}`,
    text: `Adjunto encontrarás el reporte financiero del mes de ${mes}.`,
    attachments: [
      {
        filename: `reporte-${mes.toLowerCase().replace(' ', '-')}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  console.log(`[MAILER] ✅ Reporte enviado a: ${destinatarios.join(', ')}`);
}