import { Op } from 'sequelize';
import { Cliente, Factura, FacturaItem, Producto, Proveedor } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const PLAN = {
  nombre: 'PYME 1000',
  documentosLimite: 1000,
  ticketsLimite: 2000,
};

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function resolveRange(periodo, desde, hasta, now = new Date()) {
  const today = startOfDay(now);

  if (periodo === 'hoy') {
    return { start: today, end: endOfDay(now) };
  }

  if (periodo === 'semana') {
    const day = today.getDay() || 7;
    const start = addDays(today, 1 - day);
    return { start, end: endOfDay(now) };
  }

  if (periodo === 'rango' && desde && hasta) {
    return { start: startOfDay(desde), end: endOfDay(hasta) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start, end: endOfDay(now) };
}

function previousRange(start, end) {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

function inRange(fecha, start, end) {
  const time = new Date(fecha).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function trend(current, previous) {
  if (!previous) {
    return current ? 100 : 0;
  }
  return money(((current - previous) / previous) * 100);
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${labels[Number(month) - 1]} ${year.slice(2)}`;
}

function summarize(facturas, productosById, start, end) {
  const rows = facturas.filter((f) => inRange(f.fecha, start, end));
  const emitidas = rows.filter((f) => f.estado === 'emitida');
  const anuladas = rows.filter((f) => f.estado === 'anulada');

  let ventas = 0;
  let impuestos = 0;
  let utilidad = 0;
  let productosVendidos = 0;
  const clientes = new Set();
  const porPago = { efectivo: 0, tarjeta: 0, transferencia: 0 };

  for (const factura of emitidas) {
    ventas += money(factura.total);
    impuestos += money(factura.itbis);
    clientes.add(factura.id_cliente);
    porPago[factura.metodo_pago] = (porPago[factura.metodo_pago] || 0) + 1;

    for (const item of factura.items || []) {
      const cantidad = Number(item.cantidad) || 0;
      productosVendidos += cantidad;
      const costo = money(productosById.get(item.id_producto)?.costo_compra);
      const precio = money(item.precio_unitario);
      utilidad += money((precio - costo) * cantidad);
    }
  }

  const documentos = emitidas.length;
  const ticketPromedio = documentos ? money(ventas / documentos) : 0;
  const margen = ventas ? money((utilidad / ventas) * 100) : 0;
  const devoluciones = money(anuladas.reduce((sum, f) => sum + money(f.total), 0));

  return {
    ventas: money(ventas),
    impuestos: money(impuestos),
    utilidad: money(utilidad),
    productosVendidos,
    clientesUnicos: clientes.size,
    documentos,
    anuladas: anuladas.length,
    ticketPromedio,
    margen,
    devoluciones,
    porPago,
  };
}

function topProductos(facturas, start, end, limit = 10) {
  const map = new Map();

  for (const factura of facturas) {
    if (factura.estado !== 'emitida' || !inRange(factura.fecha, start, end)) {
      continue;
    }
    for (const item of factura.items || []) {
      const key = item.id_producto;
      const current = map.get(key) || {
        id_producto: key,
        concepto: item.descripcion,
        items: 0,
        total: 0,
      };
      current.items += Number(item.cantidad) || 0;
      current.total = money(current.total + money(item.subtotal));
      map.set(key, current);
    }
  }

  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

function ventasPorMes(facturas, now) {
  const series = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(date);
    series.push({ key, etiqueta: monthLabel(key), total: 0, documentos: 0 });
  }

  const index = new Map(series.map((row, i) => [row.key, i]));
  for (const factura of facturas) {
    if (factura.estado !== 'emitida') {
      continue;
    }
    const i = index.get(monthKey(factura.fecha));
    if (i === undefined) {
      continue;
    }
    series[i].total = money(series[i].total + money(factura.total));
    series[i].documentos += 1;
  }

  return series;
}

export async function resumen(req, res) {
  try {
    const now = new Date();
    const periodo = String(req.query.periodo || 'mes');
    const range = resolveRange(periodo, req.query.desde, req.query.hasta, now);
    const prev = previousRange(range.start, range.end);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const [clientes, proveedores, productos, facturas, emitidasTotales] = await Promise.all([
      Cliente.count({ where: { estado: true } }),
      Proveedor.count({ where: { estado: true } }),
      Producto.findAll(),
      Factura.findAll({
        include: [{ model: FacturaItem, as: 'items' }],
        where: { fecha: { [Op.gte]: yearAgo } },
        order: [['fecha', 'ASC']],
      }),
      Factura.count({ where: { estado: 'emitida' } }),
    ]);

    const productosById = new Map(productos.map((p) => [p.id, p]));
    const servicios = productos.filter((p) => String(p.categoria || '').toLowerCase().includes('servicio')).length;
    const stockBajo = productos.filter((p) => p.estado && p.stock_actual <= p.stock_minimo);

    const pos = summarize(facturas, productosById, range.start, range.end);
    const posPrev = summarize(facturas, productosById, prev.start, prev.end);
    const mes = summarize(facturas, productosById, monthStart, endOfDay(now));
    const mesPrev = summarize(
      facturas,
      productosById,
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
      new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    );
    const anio = summarize(facturas, productosById, yearStart, endOfDay(now));

    const treinta = addDays(startOfDay(now), -30);
    const cobradas = facturas.filter(
      (f) => f.estado === 'emitida' && ['efectivo', 'tarjeta'].includes(f.metodo_pago)
    );
    const porCobrar = facturas.filter((f) => f.estado === 'emitida' && f.metodo_pago === 'transferencia');
    const cxCVigente = money(
      porCobrar.filter((f) => new Date(f.fecha) >= treinta).reduce((sum, f) => sum + money(f.total), 0)
    );
    const cxCVencido = money(
      porCobrar.filter((f) => new Date(f.fecha) < treinta).reduce((sum, f) => sum + money(f.total), 0)
    );

    let cxPVigente = 0;
    let cxPVencido = 0;
    for (const producto of productos) {
      if (!producto.estado || producto.stock_actual >= producto.stock_minimo) {
        continue;
      }
      const faltante = producto.stock_minimo - producto.stock_actual;
      const costo = money(faltante * money(producto.costo_compra));
      if (producto.stock_actual === 0) {
        cxPVencido += costo;
      } else {
        cxPVigente += costo;
      }
    }

    const documentosMes = mes.documentos;
    const ticketsMes = facturas
      .filter((f) => f.estado === 'emitida' && inRange(f.fecha, monthStart, endOfDay(now)))
      .reduce((sum, f) => sum + (f.items || []).reduce((s, i) => s + (Number(i.cantidad) || 0), 0), 0);

    return res.status(200).json({
      generadoEn: now.toISOString(),
      empresa: 'FacturaAI',
      plan: {
        ...PLAN,
        documentosUsados: documentosMes,
        ticketsUsados: ticketsMes,
        pagadoEl: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        venceEl: new Date(now.getFullYear(), 11, 31).toISOString(),
      },
      onboarding: [
        {
          id: 'tributaria',
          titulo: 'Configuración tributaria',
          listo: true,
          ruta: '/contabilidad',
        },
        {
          id: 'cliente',
          titulo: 'Crear cliente',
          listo: clientes > 0,
          ruta: '/inventario/clientes',
        },
        {
          id: 'inventario',
          titulo: 'Crear inventario',
          listo: productos.length > 0,
          ruta: '/inventario/productos',
        },
        {
          id: 'factura',
          titulo: 'Crear primera factura',
          listo: emitidasTotales > 0,
          ruta: '/pos',
        },
      ],
      kpis: {
        ventasMes: mes.ventas,
        ventasMesTrend: trend(mes.ventas, mesPrev.ventas),
        documentosMes: mes.documentos,
        documentosMesTrend: trend(mes.documentos, mesPrev.documentos),
        ticketPromedio: mes.ticketPromedio,
        ticketPromedioTrend: trend(mes.ticketPromedio, mesPrev.ticketPromedio),
        documentosAnio: anio.documentos,
      },
      pos: {
        periodo,
        desde: range.start.toISOString(),
        hasta: range.end.toISOString(),
        ventas: pos.ventas,
        ventasTrend: trend(pos.ventas, posPrev.ventas),
        utilidad: pos.utilidad,
        utilidadTrend: trend(pos.utilidad, posPrev.utilidad),
        impuestos: pos.impuestos,
        impuestosTrend: trend(pos.impuestos, posPrev.impuestos),
        productosVendidos: pos.productosVendidos,
        productosVendidosTrend: trend(pos.productosVendidos, posPrev.productosVendidos),
        ticketPromedio: pos.ticketPromedio,
        ticketPromedioTrend: trend(pos.ticketPromedio, posPrev.ticketPromedio),
        margen: pos.margen,
        margenTrend: trend(pos.margen, posPrev.margen),
        tickets: pos.documentos,
        ticketsTrend: trend(pos.documentos, posPrev.documentos),
        clientes: pos.clientesUnicos,
        clientesTrend: trend(pos.clientesUnicos, posPrev.clientesUnicos),
      },
      finanzas: {
        porCobrar: {
          total: money(cxCVigente + cxCVencido),
          vigente: cxCVigente,
          vencido: cxCVencido,
        },
        porPagar: {
          total: money(cxPVigente + cxPVencido),
          vigente: money(cxPVigente),
          vencido: money(cxPVencido),
        },
        devoluciones: {
          total: anio.devoluciones,
          documentos: anio.anuladas,
        },
        cobrado: money(cobradas.reduce((sum, f) => sum + money(f.total), 0)),
      },
      topProductos: topProductos(facturas, range.start, range.end),
      ventasPorMes: ventasPorMes(facturas, now),
      distribucion: [
        { clave: 'efectivo', etiqueta: 'Efectivo', valor: anio.porPago.efectivo },
        { clave: 'tarjeta', etiqueta: 'Tarjeta', valor: anio.porPago.tarjeta },
        { clave: 'transferencia', etiqueta: 'Transferencia', valor: anio.porPago.transferencia },
        { clave: 'anuladas', etiqueta: 'N. crédito', valor: anio.anuladas },
      ],
      catalogo: {
        clientes,
        productos: productos.filter((p) => p.estado).length,
        servicios,
        proveedores,
        stockBajo: stockBajo.length,
      },
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function alertas(_req, res) {
  try {
    const now = new Date();
    const hoy = startOfDay(now);
    const treinta = addDays(hoy, -30);

    const [productos, facturasHoy, transferenciasVencidas] = await Promise.all([
      Producto.findAll({ where: { estado: true } }),
      Factura.count({ where: { estado: 'emitida', fecha: { [Op.gte]: hoy } } }),
      Factura.count({
        where: {
          estado: 'emitida',
          metodo_pago: 'transferencia',
          fecha: { [Op.lt]: treinta },
        },
      }),
    ]);

    const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo);
    const items = [];

    if (facturasHoy > 0) {
      items.push({
        id: 'ventas-hoy',
        tipo: 'info',
        texto: `${facturasHoy} factura${facturasHoy === 1 ? '' : 's'} emitida${facturasHoy === 1 ? '' : 's'} hoy`,
        ruta: '/pos',
      });
    }

    if (stockBajo.length) {
      items.push({
        id: 'stock-bajo',
        tipo: 'alerta',
        texto: `${stockBajo.length} producto${stockBajo.length === 1 ? '' : 's'} en o bajo el mínimo`,
        ruta: '/inventario/existencias',
      });
    }

    if (transferenciasVencidas) {
      items.push({
        id: 'cxc',
        tipo: 'alerta',
        texto: `${transferenciasVencidas} transferencia${transferenciasVencidas === 1 ? '' : 's'} con más de 30 días`,
        ruta: '/contabilidad',
      });
    }

    if (!items.length) {
      items.push({
        id: 'ok',
        tipo: 'ok',
        texto: 'Sin alertas pendientes',
        ruta: '/dashboard',
      });
    }

    return res.status(200).json({ total: items.filter((i) => i.tipo !== 'ok').length, items });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
