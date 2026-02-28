// ============================================================
// core/resumen.js — Genera resúmenes financieros
// ============================================================

/**
 * Filtra movimientos por rango de fechas.
 * @param {Array} movimientos
 * @param {Date} desde
 * @param {Date} hasta
 * @returns {Array}
 */
function filtrarPorFecha(movimientos, desde, hasta) {
  return movimientos.filter((m) => {
    const [d, mes, a] = m.fecha.replace("'", '').split('/');
    const fecha = new Date(parseInt(a), parseInt(mes) - 1, parseInt(d));
    return fecha >= desde && fecha <= hasta;
  });
}

/**
 * Calcula totales de un array de movimientos.
 */
function calcularTotales(movimientos) {
  const ingresos = movimientos
    .filter((m) => m.tipo === 'Ingreso')
    .reduce((sum, m) => sum + m.monto, 0);

  const gastos = movimientos
    .filter((m) => m.tipo === 'Gasto')
    .reduce((sum, m) => sum + m.monto, 0);

  return { ingresos, gastos, balance: ingresos - gastos };
}

/**
 * Formatea un número como moneda chilena.
 */
function formatMonto(n) {
  return `$${n.toLocaleString('es-CL')}`;
}

/**
 * Genera el texto del resumen.
 */
export function generarResumen(movimientos, titulo, desde, hasta) {
  const filtrados = filtrarPorFecha(movimientos, desde, hasta);
  const { ingresos, gastos, balance } = calcularTotales(filtrados);

  const formatFecha = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const ultimos3 = filtrados.slice(-3).reverse();
  const movimientosTexto = ultimos3.length > 0
    ? ultimos3.map((m) => `• ${m.tipo} ${formatMonto(m.monto)} — ${m.detalle}`).join('\n')
    : '• Sin movimientos';

  const emoji = balance >= 0 ? '📈' : '📉';

  return (
    `📊 ${titulo} (${formatFecha(desde)} - ${formatFecha(hasta)})\n\n` +
    `💰 Ingresos:  ${formatMonto(ingresos)}\n` +
    `💸 Gastos:    ${formatMonto(gastos)}\n` +
    `${emoji} Balance:   ${formatMonto(balance)}\n\n` +
    `Últimos movimientos:\n${movimientosTexto}`
  );
}

/**
 * Genera texto con los últimos N movimientos.
 */
export function generarUltimosMovimientos(movimientos, n = 10) {
  const ultimos = movimientos.slice(-n).reverse();

  if (ultimos.length === 0) return '📋 No hay movimientos registrados.';

  const lista = ultimos
    .map((m) => `• ${m.fecha.replace("'", '')} — ${m.tipo} ${`$${m.monto.toLocaleString('es-CL')}`}\n  ${m.detalle}`)
    .join('\n\n');

  return `📋 Últimos ${ultimos.length} movimientos:\n\n${lista}`;
}

/**
 * Retorna el rango de fechas según el período solicitado.
 */
export function getRango(periodo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  switch (periodo) {
    case 'semanal': {
      const desde = new Date(hoy);
      desde.setDate(hoy.getDate() - 7);
      return { desde, hasta: hoy, titulo: 'Resumen semanal' };
    }
    case 'mensual': {
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { desde, hasta: hoy, titulo: 'Resumen mensual' };
    }
    case 'trimestral': {
      const desde = new Date(hoy);
      desde.setMonth(hoy.getMonth() - 3);
      return { desde, hasta: hoy, titulo: 'Resumen trimestral' };
    }
    case 'semestral': {
      const desde = new Date(hoy);
      desde.setMonth(hoy.getMonth() - 6);
      return { desde, hasta: hoy, titulo: 'Resumen semestral' };
    }
    case 'anual': {
      const desde = new Date(hoy.getFullYear(), 0, 1);
      return { desde, hasta: hoy, titulo: 'Resumen anual' };
    }
    default:
      return null;
  }
}