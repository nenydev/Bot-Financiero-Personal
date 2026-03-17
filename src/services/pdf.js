// ============================================================
// services/pdf.js — Genera el reporte mensual en PDF
// ============================================================

import PDFDocument from 'pdfkit';

/**
 * Genera un PDF con el reporte mensual y lo retorna como Buffer.
 * @param {Array} movimientos
 * @param {Array} envios
 * @param {string} mes - Ej: "Marzo 2026"
 * @returns {Promise<Buffer>}
 */
export function generarPDF(movimientos, envios, mes) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = 515; // ancho útil
    const gris = '#f5f5f5';
    const verdeOscuro = '#1a5c38';
    const negro = '#222222';
    const rojo = '#cc0000';

    // ── Encabezado ──────────────────────────────────────────
    doc.rect(40, 40, W, 50).fill(verdeOscuro);
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
      .text(`REPORTE MENSUAL — ${mes.toUpperCase()}`, 40, 55, { align: 'center', width: W });

    doc.moveDown(2.5);
    doc.fillColor(negro).fontSize(9).font('Helvetica')
      .text(`Generado el ${new Date().toLocaleDateString('es-CL')}`, { align: 'right' });

    doc.moveDown(1);

    // ── Resumen por fuente ───────────────────────────────────
    const fuentes = ['Cuenta', 'Efectivo', 'Punto'];
    const totales = {};

    for (const fuente of fuentes) {
      const ingresos = movimientos
        .filter((m) => m.tipo === 'Ingreso' && m.medioPago === fuente)
        .reduce((s, m) => s + m.monto, 0);
      const gastos = movimientos
        .filter((m) => m.tipo === 'Gasto' && m.medioPago === fuente)
        .reduce((s, m) => s + m.monto, 0);
      totales[fuente] = { ingresos, gastos, balance: ingresos - gastos };
    }

    const totalIngresos = movimientos.filter((m) => m.tipo === 'Ingreso').reduce((s, m) => s + m.monto, 0);
    const totalGastos = movimientos.filter((m) => m.tipo === 'Gasto').reduce((s, m) => s + m.monto, 0);
    const totalBalance = totalIngresos - totalGastos;

    dibujarTitulo(doc, 'RESUMEN DEL MES', verdeOscuro, W);

    // Encabezado tabla resumen
    const colsR = [180, 100, 100, 100];
    dibujarFilaTabla(doc, ['Fuente', 'Ingresos', 'Gastos', 'Balance'], colsR, true, gris);

    for (const fuente of fuentes) {
      const { ingresos, gastos, balance } = totales[fuente];
      const balanceColor = balance >= 0 ? negro : rojo;
      dibujarFilaTabla(doc, [
        fuente,
        formatMonto(ingresos),
        formatMonto(gastos),
        formatMonto(balance),
      ], colsR, false, null, [negro, negro, negro, balanceColor]);
    }

    // Fila total
    const balanceTotalColor = totalBalance >= 0 ? negro : rojo;
    dibujarFilaTabla(doc, [
      'TOTAL',
      formatMonto(totalIngresos),
      formatMonto(totalGastos),
      formatMonto(totalBalance),
    ], colsR, true, '#e8f5e9', [negro, negro, negro, balanceTotalColor]);

    doc.moveDown(1);

    // ── Movimientos ─────────────────────────────────────────
    dibujarTitulo(doc, `MOVIMIENTOS (${movimientos.length})`, verdeOscuro, W);

    const colsM = [70, 70, 80, 80, 215];
    dibujarFilaTabla(doc, ['Fecha', 'Tipo', 'Monto', 'Fuente', 'Detalle'], colsM, true, gris);

    for (const m of movimientos) {
      const fecha = m.fecha.replace("'", '');
      dibujarFilaTabla(doc, [
        fecha,
        m.tipo,
        formatMonto(m.monto),
        m.medioPago || '-',
        m.detalle,
      ], colsM, false);
    }

    doc.moveDown(1);

    // ── Envíos ──────────────────────────────────────────────
    const totalEnvios = envios.reduce((s, e) => s + e.monto, 0);
    dibujarTitulo(doc, `ENVÍOS (${envios.length})`, verdeOscuro, W);

    const colsE = [80, 100, 335];
    dibujarFilaTabla(doc, ['Fecha', 'Monto', 'Detalle'], colsE, true, gris);

    for (const e of envios) {
      dibujarFilaTabla(doc, [
        e.fecha.replace("'", ''),
        formatMonto(e.monto),
        e.detalle,
      ], colsE, false);
    }

    // Total envíos
    dibujarFilaTabla(doc, ['TOTAL', formatMonto(totalEnvios), ''], colsE, true, '#e8f5e9');

    doc.end();
  });
}

// ── Helpers ──────────────────────────────────────────────────

function formatMonto(n) {
  if (n === 0) return '$0';
  const abs = Math.abs(n).toLocaleString('es-CL');
  return n < 0 ? `-$${abs}` : `$${abs}`;
}

function dibujarTitulo(doc, texto, color, W) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor(color)
    .text(texto, 40, doc.y, { width: W, align: 'left' });
  doc.moveDown(0.3);
}

function dibujarFilaTabla(doc, celdas, anchos, esEncabezado, bgColor = null, colores = null) {
  const x = 40;
  const y = doc.y;
  const alturaFila = 18;
  const fontSize = esEncabezado ? 9 : 8;
  const font = esEncabezado ? 'Helvetica-Bold' : 'Helvetica';

  // Fondo
  if (bgColor) {
    doc.rect(x, y, anchos.reduce((a, b) => a + b, 0), alturaFila).fill(bgColor);
  }

  // Texto de cada celda
  let xActual = x;
  for (let i = 0; i < celdas.length; i++) {
    const color = colores ? colores[i] : '#222222';
    doc.fontSize(fontSize).font(font).fillColor(color)
      .text(String(celdas[i]), xActual + 3, y + 4, {
        width: anchos[i] - 6,
        height: alturaFila,
        ellipsis: true,
        lineBreak: false,
      });
    xActual += anchos[i];
  }

  // Línea separadora
  doc.moveTo(x, y + alturaFila)
    .lineTo(x + anchos.reduce((a, b) => a + b, 0), y + alturaFila)
    .strokeColor('#dddddd').lineWidth(0.5).stroke();

  doc.y = y + alturaFila + 1;
}