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

function mediana(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function limitarAtipico(valor, referencia) {
  if (!(referencia > 0) || !(valor > 0)) {
    return valor;
  }
  const techo = referencia * 2.5;
  return valor > techo ? techo : valor;
}

function ventaDe(serie, fecha) {
  return Number(serie[periodo(fecha)]) || 0;
}

function factorMercado(serie, ahora) {
  const suma = (desplazamiento) => {
    let total = 0;
    for (let n = 1; n <= 3; n += 1) {
      total += ventaDe(serie, sumarMeses(ahora, desplazamiento - n));
    }
    return total;
  };
  const actual = suma(0);
  const previo = suma(-12);
  if (previo <= 0) {
    return 1;
  }
  return Math.min(1.2, Math.max(0.6, actual / previo));
}

function esPerecedero(producto) {
  return /pegamento|silicon|acuarela|t[eé]mpera|marcador|resaltador|tinta|pintura|corrector|plastilina|plum[oó]n/i.test(
    `${producto.categoria || ''} ${producto.nombre || ''}`
  );
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
      fechas: meses,
      etiqueta: `${etiquetaMes(meses[0])} – ${etiquetaMes(meses[meses.length - 1])}`,
      temporada: true,
    };
  }
  const siguiente = sumarMeses(ahora, 1);
  return { meses: 1, fechas: [siguiente], etiqueta: etiquetaMes(siguiente), temporada: false };
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

function construirLinea({ producto, bodega, existencia, serie, venta90, clases, ahora, cobertura, desde }) {
  const referenciaFechas = cobertura.fechas.map((fecha) => sumarMeses(fecha, -12));
  const muestra = [];
  for (let n = 0; n < 12; n += 1) {
    muestra.push(ventaDe(serie, sumarMeses(ahora, -n)));
  }
  const medianaRef = mediana(muestra.filter((valor) => valor > 0));
  const factor = factorMercado(serie, ahora);
  let referencia = 0;
  let esperado = 0;
  let atipico = false;
  for (let i = 0; i < cobertura.fechas.length; i += 1) {
    const crudo = ventaDe(serie, referenciaFechas[i]);
    const limpio = limitarAtipico(crudo, medianaRef);
    if (limpio + 0.05 < crudo) {
      atipico = true;
    }
    referencia += crudo;
    esperado += limpio * factor;
  }
  const observado = referenciaFechas.every((fecha) => fecha >= desde);
  const promedioReciente = mean([1, 2, 3].map((n) => ventaDe(serie, sumarMeses(ahora, -n))));
  if (!observado && referencia <= 0 && promedioReciente > 0) {
    esperado = promedioReciente * cobertura.meses;
  }

  const demanda = cobertura.meses > 0 ? esperado / cobertura.meses : 0;
  const lead = Math.min(60, Math.max(7, Number(producto.tiempo_entrega_dias) || 15));
  const sigma = stdev(muestra);
  const seguridadBruta = Z_SERVICIO * sigma * Math.sqrt(lead / 30);
  const topeReserva = esperado > 0 ? Math.max(1, redondear(esperado * 0.2)) : 0;
  const seguridad = esperado > 0 ? Math.min(redondear(seguridadBruta), topeReserva) : 0;
  let objetivo = esperado + seguridad;
  if (Number(producto.stock_maximo) > 0) {
    objetivo = Math.min(objetivo, Number(producto.stock_maximo));
  }
  let pedir = redondear(Math.max(0, objetivo - existencia));
  let excedente = redondear(Math.max(0, existencia - objetivo));
  const venta12 = muestra.reduce((sum, valor) => sum + valor, 0);
  const perecedero = esPerecedero(producto);
  let deshacer = false;
  if (perecedero && existencia > 0 && existencia > venta12) {
    const conservar = Math.max(objetivo, venta12);
    const quitar = redondear(existencia - conservar);
    if (quitar > 0) {
      deshacer = true;
      pedir = 0;
      excedente = quitar;
    }
  }
  const movimiento = demanda / 30;
  const dias = movimiento > 0 ? Math.round(existencia / movimiento) : null;
  const punto = redondear(demanda * (lead / 30) + seguridad);
  const clasificacion = clases.get(producto.id) || 'C';
  const porMes = cobertura.meses > 0 ? referencia / cobertura.meses : 0;

  const motivos = [];
  if (deshacer) {
    motivos.push(venta12 > 0 ? 'Puede arruinarse: sobra más de un año' : 'Puede arruinarse: lleva un año sin venderse');
  }
  if (pedir > 0 && existencia <= Number(producto.stock_minimo || 0)) {
    motivos.push('Existencia bajo mínimo');
  }
  if (pedir > 0 && medianaRef > 0 && porMes >= medianaRef * 1.25) {
    motivos.push('Mes de alta venta');
  }
  if (pedir > 0 && (referencia <= 0 || (medianaRef > 0 && porMes <= medianaRef * 0.75))) {
    motivos.push('Mes de baja venta');
  }
  if (pedir > 0 && factor > 1.02) {
    motivos.push('El mercado subió');
  }
  if (pedir > 0 && factor < 0.98) {
    motivos.push('El mercado bajó');
  }
  if (cobertura.temporada && pedir > 0) {
    motivos.push('Temporada escolar');
  }
  if (clasificacion === 'A' && pedir > 0) {
    motivos.push('Alta rotación');
  }
  if (atipico && pedir > 0) {
    motivos.push('Se recortó un mes atípico');
  }
  if (!motivos.length && pedir > 0) {
    motivos.push('Reposición por demanda');
  }
  if (!pedir && !deshacer && excedente > 0) {
    motivos.push('La existencia cubre la demanda');
  }

  const fuente = 'Mismo mes del año anterior';
  const explicacion = armarExplicacion({
    bodega,
    producto,
    existencia,
    referencia,
    referenciaFechas,
    esperado,
    cobertura,
    seguridad,
    pedir,
    excedente,
    lead,
    factor,
    atipico,
    deshacer,
    venta12,
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
    temporada: redondear(referencia),
    demandaMensual: money(demanda),
    horizonteMeses: cobertura.meses,
    horizonte: cobertura.etiqueta,
    stockSeguridad: seguridad,
    puntoReorden: punto,
    diasInventario: dias,
    movimientoDiario: money(movimiento),
    pedir,
    excedente,
    deshacer,
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
      { etiqueta: 'Temporada anterior', valor: String(redondear(referencia)) },
      { etiqueta: 'Ajuste de mercado', valor: factor > 1.02 ? `+${money((factor - 1) * 100)}%` : factor < 0.98 ? `-${money((1 - factor) * 100)}%` : 'Parejo' },
      { etiqueta: 'Ventas de 12 meses', valor: String(redondear(venta12)) },
      { etiqueta: 'Puede arruinarse', valor: perecedero ? 'Sí' : 'No' },
      { etiqueta: 'Demanda mensual', valor: String(money(demanda)) },
      { etiqueta: 'Horizonte', valor: cobertura.etiqueta },
      { etiqueta: 'Reserva', valor: String(seguridad) },
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
  referencia,
  referenciaFechas,
  esperado,
  cobertura,
  seguridad,
  pedir,
  excedente,
  lead,
  factor,
  atipico,
  deshacer,
  venta12,
}) {
  const periodoTxt =
    referenciaFechas.length > 1
      ? `${etiquetaMes(referenciaFechas[0])} – ${etiquetaMes(referenciaFechas[referenciaFechas.length - 1])}`
      : etiquetaMes(referenciaFechas[0]);
  const base = `${bodega.nombre} tiene ${existencia} de ${producto.nombre}. `;
  if (deshacer) {
    const historia =
      venta12 > 0
        ? `En los últimos 12 meses se vendieron ${redondear(venta12)}. `
        : 'En los últimos 12 meses no se vendió. ';
    return (
      base +
      historia +
      `Es un producto que se puede secar o arruinar, y la existencia supera un año de ventas. Conviene deshacerse de ${excedente} unidades y no comprar más.`
    );
  }
  const historia =
    referencia > 0
      ? `En ${periodoTxt} se vendieron ${redondear(referencia)} unidades. `
      : `En ${periodoTxt} no hubo ventas de este producto. `;
  const mercado =
    factor > 1.02
      ? `El trimestre reciente está ${money((factor - 1) * 100)}% arriba del año pasado, así que la compra sube un poco. `
      : factor < 0.98
        ? `El trimestre reciente está ${money((1 - factor) * 100)}% abajo del año pasado, así que la compra baja. `
        : 'El trimestre reciente va parejo con el año pasado. ';
  const atipicoTxt = atipico ? 'Un mes se salió de lo normal y se recortó para no inflar el pedido. ' : '';
  const ritmo = `Para ${cobertura.etiqueta} se esperan ${money(esperado)} unidades, más ${seguridad} de reserva por los ${lead} días de entrega. `;
  const decision = pedir
    ? `Por eso se piden ${pedir} unidades.`
    : excedente > 0
      ? `La existencia cubre ese cálculo y sobran ${excedente} unidades, así que no se compra.`
      : 'La existencia cubre ese cálculo, así que no se compra.';
  return base + historia + mercado + atipicoTxt + ritmo + decision;
}

export async function construirPedidoSugerido(fecha) {
  const ahora = fecha instanceof Date ? fecha : new Date();
  const desde = sumarMeses(new Date(ahora.getFullYear(), ahora.getMonth(), 1), -14);
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
  const bodegasDto = bodegas.map((bodega) => {
    const lineas = [];
    for (const producto of productos) {
      const existencia = stock.get(clave(bodega.id, producto.id)) || 0;
      const propia = porBodega.get(clave(bodega.id, producto.id)) || {};
      const empresa = serieDesde(ventas, producto.id);
      const totalBodegas = bodegas.reduce((sum, item) => sum + (stock.get(clave(item.id, producto.id)) || 0), 0);
      const parte = totalBodegas > 0 ? existencia / totalBodegas : bodega.id === principal.id ? 1 : 0;
      const serie = {};
      const meses = new Set([...Object.keys(propia), ...Object.keys(empresa)]);
      for (const mes of meses) {
        const deBodega = propia[mes] || 0;
        if (deBodega > 0) {
          serie[mes] = deBodega;
        } else if (bodega.id === principal.id) {
          serie[mes] = empresa[mes] || 0;
        }
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
        desde,
      });
      if (linea.pedir > 0 || linea.existencia > 0 || linea.temporada > 0 || linea.deshacer) {
        lineas.push(linea);
      }
    }
    lineas.sort((a, b) => b.pedir - a.pedir || Number(b.deshacer) - Number(a.deshacer) || b.excedente - a.excedente || a.nombre.localeCompare(b.nombre));
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
      const excluyentes = [
        ['El mercado subió', 'El mercado bajó'],
        ['Mes de alta venta', 'Mes de baja venta'],
      ];
      for (const [alto, bajo] of excluyentes) {
        if (actual.motivos.includes(alto) && actual.motivos.includes(bajo)) {
          actual.motivos = actual.motivos.filter((motivo) => motivo !== alto && motivo !== bajo);
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
  const referenciaFechas = cobertura.fechas.map((fecha) => sumarMeses(fecha, -12));
  const periodoReferencia =
    referenciaFechas.length > 1
      ? `${etiquetaMes(referenciaFechas[0])} – ${etiquetaMes(referenciaFechas[referenciaFechas.length - 1])}`
      : etiquetaMes(referenciaFechas[0]);

  return {
    generadoEn: ahora.toISOString(),
    motor: 'temporada',
    motorDetalle:
      'Cada mes se compra según lo vendido en ese mismo mes el año pasado. Si ese mes fue alto se pide más y si fue bajo se pide poco. Si el mercado reciente subió, el pedido sube un poco; si bajó, se recorta. Un mes atípico no manda la compra. En productos que se pueden arruinar, lo que sobra para más de un año se marca para deshacerse.',
    temporada: {
      nombre: cobertura.temporada ? 'Temporada escolar' : 'Mismo mes',
      periodo: periodoReferencia,
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
