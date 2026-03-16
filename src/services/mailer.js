// ============================================================
// services/mailer.js — Envía el reporte PDF por email
// ============================================================

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Envía el reporte mensual PDF por email.
 * @param {Buffer} pdfBuffer
 * @param {string} mes - Ej: "Marzo 2026"
 * @returns {Promise<void>}
 */
export async function enviarReportePorEmail(pdfBuffer, mes) {
  const destinatarios = process.env.GMAIL_RECIPIENTS?.split(',').map((e) => e.trim()) || [];

  if (destinatarios.length === 0) {
    console.warn('[MAILER] ⚠️ No hay destinatarios configurados en GMAIL_RECIPIENTS');
    return;
  }

  await transporter.sendMail({
    from: `"Bot Financiero" <${process.env.GMAIL_USER}>`,
    to: destinatarios.join(', '),
    subject: `Reporte Financiero — ${mes}`,
    text: `Adjunto encontrarás el reporte financiero del mes de ${mes}.`,
    attachments: [
      {
        filename: `reporte-${mes.toLowerCase().replace(' ', '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log(`[MAILER] ✅ Reporte enviado a: ${destinatarios.join(', ')}`);
}