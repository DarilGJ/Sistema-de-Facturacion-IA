import axios from 'axios';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';
import { env } from '../config/env.js';

const MESES_ESCOLARES = new Set([12, 1, 2]);
const MESES_PREPARACION = new Set([10, 11]);
const Z_SERVICIO = 1.65;
const NOMBRES_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function mean(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values) {
  if (values.length < 2) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function periodo(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parsePeriodo(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function sumarMeses(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function etiquetaMes(date) {
  return `${NOMBRES_MES[date.getMonth()]} ${date.getFullYear()}`;
}

function redondear(value) {
  return Math.max(0, Math.ceil(Number(value) - 1e-9));
}

function clave(bodegaId, productoId) {
  return `${bodegaId}:${productoId}`;
}

function temporadaAnterior(ahora) {
  const year = ahora.getMonth() >= 2 ? ahora.getFullYear() : ahora.getFullYear() - 1;
  const inicio = new Date(year - 1, 11, 1);
  return [inicio, sumarMeses(inicio, 1), sumarMeses(inicio, 2)].map(periodo);
}

function horizonte(ahora) {
  const month = ahora.getMonth() + 1;
  if (MESES_ESCOLARES.has(month) || MESES_PREPARACION.has(month)) {
    const meses = [];
    let cursor = month === 10 || month === 11 ? new Date(ahora.getFullYear(), 11, 1) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    if (month === 1) {
      cursor = new Date(ahora.getFullYear(), 0, 1);
    }
    while (cursor.getMonth() + 1 !== 2) {
      meses.push(cursor);
      cursor = sumarMeses(cursor, 1);
      if (meses.length > 4) {
        break;
      }
    }
    meses.push(cursor);
    return {
      meses: meses.length,
      etiqueta: `${etiquetaMes(meses[0])} – ${etiquetaMes(meses[meses.length - 1])}`,
      temporada: true,
    };
  }
  const siguiente = sumarMeses(ahora, 1);
  return { meses: 1, etiqueta: etiquetaMes(siguiente), temporada: false };
}

function serieDesde(mapa, productoId) {
  return mapa.get(productoId) || {};
}

async function ventasMensuales(desde) {
  const filas = await sequelize.query(
    `SELECT fi.id_producto AS idProducto,
            DATE_FORMAT(f.fecha, '%Y-%m') AS periodo,
            SUM(fi.cantidad) AS cantidad
     FROM factura_items fi
     INNER JOIN facturas f ON f.id = fi.id_factura
     WHERE f.estado <> 'anulada' AND f.fecha >= :desde
     GROUP BY fi.id_producto, DATE_FORMAT(f.fecha, '%Y-%m')`,
    { replacements: { desde }, type: QueryTypes.SELECT }
  );
  const mapa = new Map();
  for (const fila of filas) {
    const actual = mapa.get(fila.idProducto) || {};
    actual[fila.periodo] = Number(fila.cantidad) || 0;
    mapa.set(fila.idProducto, actual);
  }
  return mapa;
}

async function ventasBodega(desde) {
  const filas = await sequelize.query(
    `SELECT id_bodega AS idBodega,
            id_producto AS idProducto,
            DATE_FORMAT(fecha, '%Y-%m') AS periodo,
            SUM(ABS(cantidad)) AS cantidad
     FROM inventario_movimientos
     WHERE proceso = 'salida_venta'
       AND id_producto IS NOT NULL
       AND fecha >= :desde
     GROUP BY id_bodega, id_producto, DATE_FORMAT(fecha, '%Y-%m')`,
    { replacements: { desde }, type: QueryTypes.SELECT }
  );
  const mapa = new Map();
  for (const fila of filas) {
    if (!fila.idBodega) {
      continue;
    }
    const id = clave(fila.idBodega, fila.idProducto);
    const actual = mapa.get(id) || {};
    actual[fila.periodo] = Number(fila.cantidad) || 0;
    mapa.set(id, actual);
  }
  return mapa;
}

async function ventasRecientes(desde) {
  const [empresa, bodegas] = await Promise.all([
    sequelize.query(
      `SELECT fi.id_producto AS idProducto, SUM(fi.cantidad) AS cantidad
       FROM factura_items fi
       INNER JOIN facturas f ON f.id = fi.id_factura
       WHERE f.estado <> 'anulada' AND f.fecha >= :desde
       GROUP BY fi.id_producto`,
      { replacements: { desde }, type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id_bodega AS idBodega, id_producto AS idProducto, SUM(ABS(cantidad)) AS cantidad
       FROM inventario_movimientos
       WHERE proceso = 'salida_venta' AND id_producto IS NOT NULL AND fecha >= :desde
       GROUP BY id_bodega, id_producto`,
      { replacements: { desde }, type: QueryTypes.SELECT }
    ),
  ]);
  return {
    empresa: new Map(empresa.map((fila) => [fila.idProducto, Number(fila.cantidad) || 0])),
    bodegas: new Map(bodegas.filter((fila) => fila.idBodega).map((fila) => [clave(fila.idBodega, fila.idProducto), Number(fila.cantidad) || 0])),
  };
}

function clasificar(productos, ventas) {
  const ranking = [...ventas.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranking.length || 1;
  const mapa = new Map();
  ranking.forEach(([id], index) => {
    const percentil = index / total;
    mapa.set(id, percentil < 0.2 ? 'A' : percentil < 0.5 ? 'B' : 'C');
  });
  for (const producto of productos) {
    if (!mapa.has(producto.id)) {
      mapa.set(producto.id, 'C');
    }
  }
  return mapa;
}

function completarHistorial(serie, desde, hasta) {
  const historial = [];
  for (let cursor = new Date(desde); cursor <= hasta; cursor = sumarMeses(cursor, 1)) {
    const key = periodo(cursor);
    historial.push({ periodo: key, cantidad: Number(serie[key]) || 0 });
  }
  return historial;
}

async function pronosticosIa(productos, ventas, leadPorProducto) {
  try {
    const health = await axios.get(`${env.aiEngineUrl}/health`, { timeout: 1500 });
    if (!health.data?.modelo_cargado) {
      return null;
    }
  } catch {
    return null;
  }

  const ahora = new Date();
  const desde = sumarMeses(new Date(ahora.getFullYear(), ahora.getMonth(), 1), -14);
  const hasta = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const pronosticos = new Map();
  const candidatos = productos.filter((producto) => {
    const historial = completarHistorial(serieDesde(ventas, producto.id), desde, hasta);
    return historial.filter((mes) => mes.cantidad > 0).length >= 3 && historial.length >= 12;
  });

  await Promise.all(
    candidatos.map(async (producto) => {
      try {
        const response = await axios.post(
          `${env.aiEngineUrl}/pronostico`,
          {
            sku: producto.sku,
            categoria: producto.categoria || 'Sin categoría',
            tiempo_entrega_dias: leadPorProducto.get(producto.id) || 15,
            historial: completarHistorial(serieDesde(ventas, producto.id), desde, hasta),
          },
          { timeout: 8000 }
        );
        if (!response.data?.revision_manual && Number.isFinite(Number(response.data?.demanda_esperada))) {
          pronosticos.set(producto.id, response.data);
        }
      } catch {
        // El pedido sigue con la estimación de temporada si un producto no puede pronosticarse.
      }
    })
  );

  return pronosticos.size ? pronosticos : null;
}

function construirLinea({ producto, bodega, existencia, serie, venta90, clases, ahora, cobertura, ia, parte }) {
  const keys = Object.keys(serie);
  const valores = keys.map((key) => serie[key]);
  const recientes = [0, 1, 2].map((offset) => serie[periodo(sumarMeses(ahora, -offset))] || 0);
  const promedio = mean(recientes.filter((value, index) => index < 3));
  const siguiente = sumarMeses(ahora, 1);
  const mismoMes = serie[periodo(sumarMeses(siguiente, -12))];
  let demanda = mismoMes === undefined ? promedio : mismoMes * 0.6 + promedio * 0.4;
  const temporadaKeys = temporadaAnterior(ahora);
  const ventaTemporada = temporadaKeys.reduce((sum, key) => sum + (serie[key] || 0), 0);
  const indice = mean(valores) > 0 ? mean(temporadaKeys.map((key) => serie[key] || 0)) / mean(valores) : 1;
  const escolar =
    cobertura.temporada &&
    indice >= 1.15 &&
    (ventaTemporada > 0 || /escolar|papel|escritura|arte|cuaderno/i.test(`${producto.categoria} ${producto.nombre}`));
  if (escolar) {
    demanda = Math.max(demanda, promedio * Math.min(indice, 2.5));
  }
  if (ia && Number(ia.demanda_esperada) > 0) {
    demanda = Number(ia.demanda_esperada) * (parte > 0 && parte < 1 ? parte : 1);
  }

  const lead = Math.min(60, Math.max(7, Number(producto.tiempo_entrega_dias) || 15));
  const sigma = stdev(valores.length ? valores : recientes);
  const seguridad = redondear(Z_SERVICIO * sigma * Math.sqrt(lead / 30));
  const proyectada = demanda * cobertura.meses;
  const objetivoBase = ventaTemporada > 0 && cobertura.temporada ? ventaTemporada * 0.6 + proyectada * 0.4 : proyectada;
  let objetivo = objetivoBase + seguridad;
  if (Number(producto.stock_maximo) > 0) {
    objetivo = Math.min(objetivo, Number(producto.stock_maximo));
  }
  const pedir = redondear(Math.max(0, objetivo - existencia));
  const excedente = redondear(Math.max(0, existencia - objetivo));
  const movimiento = demanda / 30;
  const dias = movimiento > 0 ? Math.round(existencia / movimiento) : null;
  const punto = redondear(demanda * (lead / 30) + seguridad);
  const clasificacion = clases.get(producto.id) || 'C';

  const motivos = [];
  if (pedir > 0 && existencia <= Number(producto.stock_minimo || 0)) {
    motivos.push('Existencia bajo mínimo');
  }
  if (pedir > 0 && existencia < punto) {
    motivos.push('Bajo el punto de reorden');
  }
  if (cobertura.temporada && ventaTemporada > 0 && pedir > 0) {
    motivos.push('Temporada escolar');
  }
  if (clasificacion === 'A' && pedir > 0) {
    motivos.push('Alta rotación');
  }
  if (venta90 > 0 && clasificacion !== 'C' && pedir > 0 && !motivos.includes('Alta rotación')) {
    motivos.push('Entre los más vendidos');
  }
  if (dias !== null && dias < lead && pedir > 0) {
    motivos.push('No cubre la entrega');
  }
  if (!motivos.length && pedir > 0) {
    motivos.push('Reposición por demanda');
  }
  if (!pedir && excedente > 0) {
    motivos.push('La existencia cubre la demanda');
  }

  const fuente = ia ? 'Pronóstico del modelo' : escolar ? 'Temporada y rotación' : 'Rotación reciente';
  const explicacion = armarExplicacion({
    bodega,
    producto,
    existencia,
    ventaTemporada,
    temporadaKeys,
    demanda,
    cobertura,
    seguridad,
    pedir,
    excedente,
    movimiento,
    dias,
    lead,
    fuente,
    indice,
  });

  return {
    id_producto: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    categoria: producto.categoria || 'Sin categoría',
    marca: producto.marca || '',
    proveedor: producto.proveedor || 'Sin proveedor',
    existencia,
    minimo: Number(producto.stock_minimo) || 0,
    venta90,
    temporada: redondear(ventaTemporada),
    demandaMensual: money(demanda),
    horizonteMeses: cobertura.meses,
    horizonte: cobertura.etiqueta,
    stockSeguridad: seguridad,
    puntoReorden: punto,
    diasInventario: dias,
    movimientoDiario: money(movimiento),
    pedir,
    excedente,
    costo: money(producto.costo_compra),
    inversion: money(pedir * Number(producto.costo_compra || 0)),
    clasificacion,
    motivos,
    explicacion,
    fuente,
    factores: [
      { etiqueta: 'Existencia en bodega', valor: String(existencia) },
      { etiqueta: 'Mínimo', valor: String(Number(producto.stock_minimo) || 0) },
      { etiqueta: 'Venta de 90 días', valor: String(redondear(venta90)) },
      { etiqueta: 'Temporada anterior', valor: String(redondear(ventaTemporada)) },
      { etiqueta: 'Demanda mensual', valor: String(money(demanda)) },
      { etiqueta: 'Horizonte', valor: cobertura.etiqueta },
      { etiqueta: 'Stock de seguridad', valor: String(seguridad) },
      { etiqueta: 'Punto de reorden', valor: String(punto) },
      { etiqueta: 'Movimiento esperado', valor: `${money(movimiento)} uds/día` },
      { etiqueta: 'Días de inventario', valor: dias === null ? 'Sin rotación' : `${dias} días` },
      { etiqueta: 'Entrega del proveedor', valor: `${lead} días` },
      { etiqueta: 'Fuente', valor: fuente },
    ],
  };
}

function armarExplicacion({
  bodega,
  producto,
  existencia,
  ventaTemporada,
  temporadaKeys,
  demanda,
  cobertura,
  seguridad,
  pedir,
  excedente,
  movimiento,
  dias,
  lead,
  fuente,
  indice,
}) {
  const temporadaTxt = temporadaKeys.map((key) => etiquetaMes(parsePeriodo(key))).join(', ');
  const base = `${bodega.nombre} tiene ${existencia} de ${producto.nombre}. `;
  const historia =
    ventaTemporada > 0
      ? `En la temporada anterior (${temporadaTxt}) salieron ${redondear(ventaTemporada)} unidades. `
      : 'No hay una temporada escolar anterior con ventas de este producto. ';
  const ritmo = `La demanda esperada es ${money(demanda)} unidades al mes (${fuente.toLowerCase()}` +
    (indice >= 1.15 ? `, ${money(indice)}× el promedio en temporada` : '') +
    `) durante ${cobertura.etiqueta}. Se suman ${seguridad} de stock de seguridad por el tiempo de entrega de ${lead} días. `;
  const decision = pedir
    ? `Por eso se piden ${pedir} unidades. El movimiento esperado es ${money(movimiento)} por día` +
      (dias === null ? '.' : ` y el stock actual alcanza para ${dias} días.`)
    : `La existencia supera lo necesario en ${excedente} unidades, así que esta bodega no entra al pedido.`;
  return base + historia + ritmo + decision;
}

export async function construirPedidoSugerido() {
  const ahora = new Date();
  const desde = sumarMeses(new Date(ahora.getFullYear(), ahora.getMonth(), 1), -14);
  const desde90 = new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000);
  const cobertura = horizonte(ahora);

  const [productos, bodegas, existencias, ventas, porBodega, recientes] = await Promise.all([
    sequelize.query(
      `SELECT p.id, p.sku, p.nombre, p.tipo, p.categoria, p.marca, p.costo_compra,
              p.stock_minimo, p.stock_maximo, p.stock_actual, pr.tiempo_entrega_dias,
              pr.nombre_comercial AS proveedor
       FROM productos p
       LEFT JOIN proveedores pr ON pr.id = p.id_proveedor
       WHERE p.estado = 1 AND p.tipo <> 'servicio'
         AND (p.categoria IS NULL OR p.categoria NOT LIKE '%servicio%')`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id, nombre, principal, ubicacion
       FROM bodegas
       WHERE estado = 1
       ORDER BY principal DESC, nombre ASC`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT id_bodega AS idBodega, id_producto AS idProducto, cantidad
       FROM bodega_productos`,
      { type: QueryTypes.SELECT }
    ),
    ventasMensuales(desde),
    ventasBodega(desde),
    ventasRecientes(desde),
  ]);

  if (!bodegas.length) {
    return vacio(ahora, cobertura, 'No hay bodegas activas para armar el pedido.');
  }

  const principal = bodegas.find((bodega) => bodega.principal) || bodegas[0];
  const stock = new Map();
  for (const fila of existencias) {
    stock.set(clave(fila.idBodega, fila.idProducto), Number(fila.cantidad) || 0);
  }
  for (const producto of productos) {
    const asignado = bodegas.reduce((sum, bodega) => sum + (stock.get(clave(bodega.id, producto.id)) || 0), 0);
    const diferencia = Number(producto.stock_actual) - asignado;
    if (diferencia > 0) {
      const id = clave(principal.id, producto.id);
      stock.set(id, (stock.get(id) || 0) + diferencia);
    }
  }

  const ventaAnual = new Map();
  for (const [id, serie] of ventas) {
    ventaAnual.set(id, Object.values(serie).reduce((sum, value) => sum + value, 0));
  }
  const clases = clasificar(productos, ventaAnual);
  const leadPorProducto = new Map(productos.map((producto) => [producto.id, Number(producto.tiempo_entrega_dias) || 15]));
  const ia = await pronosticosIa(productos, ventas, leadPorProducto);

  const bodegasDto = bodegas.map((bodega) => {
    const lineas = [];
    for (const producto of productos) {
      const existencia = stock.get(clave(bodega.id, producto.id)) || 0;
      const propia = porBodega.get(clave(bodega.id, producto.id)) || {};
      const empresa = serieDesde(ventas, producto.id);
      const totalEmpresa = Object.values(empresa).reduce((sum, value) => sum + value, 0);
      const totalBodegas = bodegas.reduce((sum, item) => sum + (stock.get(clave(item.id, producto.id)) || 0), 0);
      const parte = totalBodegas > 0 ? existencia / totalBodegas : bodega.id === principal.id ? 1 : 0;
      const serie = {};
      const meses = new Set([...Object.keys(propia), ...Object.keys(empresa)]);
      for (const mes of meses) {
        serie[mes] = Math.max(propia[mes] || 0, (empresa[mes] || 0) * parte);
      }
      const tuvoMovimiento = Object.values(serie).some((value) => value > 0) || existencia > 0;
      if (!tuvoMovimiento && !porBodega.has(clave(bodega.id, producto.id))) {
        continue;
      }
      const venta90 = recientes.bodegas.get(clave(bodega.id, producto.id)) || (recientes.empresa.get(producto.id) || 0) * parte;
      const linea = construirLinea({
        producto,
        bodega,
        existencia,
        serie,
        venta90,
        clases,
        ahora,
        cobertura,
        ia: ia?.get(producto.id) || null,
        parte,
      });
      if (linea.pedir > 0 || linea.existencia > 0 || linea.temporada > 0) {
        lineas.push(linea);
      }
    }
    lineas.sort((a, b) => b.pedir - a.pedir || b.inversion - a.inversion || a.nombre.localeCompare(b.nombre));
    const aPedir = lineas.filter((linea) => linea.pedir > 0);
    return {
      id: bodega.id,
      nombre: bodega.nombre,
      principal: Boolean(bodega.principal),
      ubicacion: bodega.ubicacion || '',
      productos: aPedir.length,
      unidades: aPedir.reduce((sum, linea) => sum + linea.pedir, 0),
      inversion: money(aPedir.reduce((sum, linea) => sum + linea.inversion, 0)),
      lineas,
    };
  });

  const centralMap = new Map();
  for (const bodega of bodegasDto) {
    for (const linea of bodega.lineas) {
      if (linea.pedir <= 0) {
        continue;
      }
      const actual = centralMap.get(linea.id_producto) || {
        ...linea,
        existencia: 0,
        venta90: 0,
        temporada: 0,
        demandaMensual: 0,
        pedir: 0,
        inversion: 0,
        reparto: [],
        motivos: [],
        detalle: [],
      };
      actual.existencia += linea.existencia;
      actual.venta90 += linea.venta90;
      actual.temporada += linea.temporada;
      actual.demandaMensual = money(actual.demandaMensual + linea.demandaMensual);
      actual.pedir += linea.pedir;
      actual.inversion = money(actual.inversion + linea.inversion);
      actual.reparto.push({
        id: bodega.id,
        bodega: bodega.nombre,
        pedir: linea.pedir,
        existencia: linea.existencia,
      });
      for (const motivo of linea.motivos) {
        if (!actual.motivos.includes(motivo)) {
          actual.motivos.push(motivo);
        }
      }
      actual.detalle.push(linea.explicacion);
      actual.explicacion = actual.detalle.join(' ');
      actual.factores = [
        { etiqueta: 'Pedido total', valor: String(actual.pedir) },
        { etiqueta: 'Existencia en todas las bodegas', valor: String(actual.existencia) },
        { etiqueta: 'Temporada anterior', valor: String(actual.temporada) },
        { etiqueta: 'Inversión', valor: `Q ${actual.inversion.toFixed(2)}` },
        ...actual.reparto.map((parte) => ({
          etiqueta: parte.bodega,
          valor: `${parte.pedir} uds · hay ${parte.existencia}`,
        })),
      ];
      centralMap.set(linea.id_producto, actual);
    }
  }

  const central = [...centralMap.values()].sort((a, b) => b.inversion - a.inversion || b.pedir - a.pedir);
  const temporadaKeys = temporadaAnterior(ahora);

  return {
    generadoEn: ahora.toISOString(),
    motor: ia ? 'ia' : 'temporada',
    motorDetalle: ia
      ? 'La cantidad mensual sale del modelo de demanda y se reparte según lo que vendió cada bodega.'
      : 'Cada bodega se calcula con su existencia, la temporada escolar anterior, los más vendidos y el punto de reorden. El pedido central solo suma lo que falta en cada una.',
    temporada: {
      nombre: cobertura.temporada ? 'Temporada escolar' : 'Reposición',
      periodo: `${etiquetaMes(parsePeriodo(temporadaKeys[0]))} – ${etiquetaMes(parsePeriodo(temporadaKeys[2]))}`,
      horizonte: cobertura.etiqueta,
      preparacion: cobertura.temporada,
    },
    resumen: {
      productos: central.length,
      unidades: central.reduce((sum, linea) => sum + linea.pedir, 0),
      inversion: money(central.reduce((sum, linea) => sum + linea.inversion, 0)),
      bodegas: bodegasDto.filter((bodega) => bodega.productos > 0).length,
    },
    bodegas: bodegasDto,
    central,
  };
}

function vacio(ahora, cobertura, detalle) {
  return {
    generadoEn: ahora.toISOString(),
    motor: 'temporada',
    motorDetalle: detalle,
    temporada: { nombre: 'Reposición', periodo: '', horizonte: cobertura.etiqueta, preparacion: false },
    resumen: { productos: 0, unidades: 0, inversion: 0, bodegas: 0 },
    bodegas: [],
    central: [],
  };
}
