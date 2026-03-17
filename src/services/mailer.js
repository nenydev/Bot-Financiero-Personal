// ============================================================
// services/mailer.js — Envía el reporte PDF por email via Gmail OAuth2
// ============================================================

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});

export async function enviarReportePorEmail(pdfBuffer, mes, destinatariosExtra = []) {
  const destinatarios = destinatariosExtra.length > 0
    ? destinatariosExtra
    : process.env.GMAIL_RECIPIENTS?.split(',').map((e) => e.trim()) || [];

  if (destinatarios.length === 0) {
    console.warn('[MAILER] ⚠️ No hay destinatarios configurados');
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