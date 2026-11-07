import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const HASTA = { year: 2026, month: 11, day: 6 };
const NOTAS = 'Historial de temporada escolar generado para demostración.';
const VENDEDOR = 'Administrador';

const FACTOR_MES = {
  1: 2.75,
  2: 2.25,
  3: 1.05,
  4: 0.3,
  5: 1.05,
  6: 0.28,
  7: 1.6,
  8: 1.1,
  9: 0.95,
  10: 1.7,
  11: 1.9,
  12: 2.55,
};

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function pad(value, size = 2) {
  return String(value).padStart(size, '0');
}

function texto(categoria) {
  return String(categoria || '').toLowerCase();
}

function sensibilidad(categoria) {
  const cat = texto(categoria);
  if (cat.includes('tecnolog') || cat.includes('oficina') || cat.includes('ropa')) {
    return 0.38;
  }
  return 1;
}

function baseMensual(categoria, precio) {
  const cat = texto(categoria);
  if (cat.includes('escritura') || cat === 'escolar' || cat === 'libreria') {
    return precio < 20 ? 24 : 12;
  }
  if (cat.includes('papel') || cat.includes('papeler')) {
    return 11;
  }
  if (cat.includes('arte')) {
    return 8;
  }
  if (cat.includes('util')) {
    return 7;
  }
  if (cat.includes('oficina')) {
    return 5;
  }
  if (cat.includes('tecnolog') || cat.includes('ropa')) {
    return 2;
  }
  return 4;
}

function factorTemporada(month, categoria) {
  const bruto = FACTOR_MES[month];
  return 1 + (bruto - 1) * sensibilidad(categoria);
}

function diasHabiles(year, month, tope) {
  const ultimo = new Date(year, month, 0).getDate();
  const limite = tope && tope.year === year && tope.month === month ? Math.min(ultimo, tope.day) : ultimo;
  const dias = [];
  for (let day = 1; day <= limite; day += 1) {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow !== 0) {
      dias.push(day);
    }
  }
  return dias;
}

function pesoDia(year, month, day) {
  const dow = new Date(year, month - 1, day).getDay();
  let peso = dow === 6 ? 0.45 : 1;
  if ((month === 1 || month === 2 || month === 12) && day <= 18) {
    peso *= 1.4;
  }
  if (month === 7 && day <= 15) {
    peso *= 1.25;
  }
  return peso;
}

function elegirDia(rng, dias, year, month) {
  const pesos = dias.map((day) => pesoDia(year, month, day));
  let ticket = rng() * pesos.reduce((sum, peso) => sum + peso, 0);
  for (let i = 0; i < dias.length; i += 1) {
    ticket -= pesos[i];
    if (ticket <= 0) {
      return dias[i];
    }
  }
  return dias[dias.length - 1];
}

function fechaDe(year, month, day, rng) {
  const hour = 8 + Math.floor(rng() * 10);
  const minute = Math.floor(rng() * 60);
  const second = Math.floor(rng() * 60);
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

function esColegio(nombre) {
  return /colegio|escuela|estudiante|academia|liceo/i.test(nombre);
}

function elegirCliente(rng, clientes, colegios, month) {
  const pico = [1, 2, 7, 10, 11, 12].includes(month);
  if (pico && colegios.length && rng() < 0.5) {
    return colegios[Math.floor(rng() * colegios.length)];
  }
  return clientes[Math.floor(rng() * clientes.length)];
}

function topeLinea(precio) {
  if (precio >= 150) return 2;
  if (precio >= 40) return 5;
  return 10;
}

function armarCanastas(rng, objetivos, productos) {
  const restante = new Map(objetivos);
  const facturas = [];
  let guardia = 0;
  while ([...restante.values()].some((qty) => qty > 0)) {
    guardia += 1;
    if (guardia > 8000) {
      throw new Error('No se pudo repartir la demanda del mes en facturas.');
    }
    const vivos = [...restante.entries()].filter(([, qty]) => qty > 0);
    const lineasMeta = Math.min(vivos.length, 2 + Math.floor(rng() * 4));
    const pool = [...vivos];
    const lineas = [];
    while (lineas.length < lineasMeta && pool.length) {
      const index = Math.floor(rng() * pool.length);
      const [id, qty] = pool.splice(index, 1)[0];
      const producto = productos.get(id);
      const tomar = Math.min(qty, 1 + Math.floor(rng() * topeLinea(producto.precio)));
      restante.set(id, qty - tomar);
      lineas.push({
        id_producto: id,
        descripcion: producto.nombre,
        sku: producto.sku,
        cantidad: tomar,
        precio_unitario: producto.precio,
        tasa: producto.tasa,
      });
    }
    facturas.push(lineas);
  }
  return facturas;
}

function objetivosDelMes(rng, productos, year, month, escala) {
  const anio = year === 2025 ? 1 : 1.1;
  const objetivos = new Map();
  for (const producto of productos.values()) {
    const popularidad = 0.62 + ((producto.id * 17) % 100) / 100;
    const ruido = 0.86 + rng() * 0.28;
    const unidades = Math.round(
      baseMensual(producto.categoria, producto.precio) *
        popularidad *
        factorTemporada(month, producto.categoria) *
        anio *
        ruido *
        escala
    );
    if (unidades > 0) {
      objetivos.set(producto.id, unidades);
    }
  }
  return objetivos;
}

async function insertarLotes(conn, sql, rows, size = 250) {
  for (let i = 0; i < rows.length; i += size) {
    const lote = rows.slice(i, i + size);
    await conn.query(sql, [lote]);
  }
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  dateStrings: true,
});

const [productosRows] = await conn.query(
  `SELECT id, sku, nombre, categoria, precio_venta, impuesto_porcentaje
   FROM productos
   WHERE estado = 1 AND tipo <> 'servicio'
     AND (categoria IS NULL OR categoria NOT LIKE '%servicio%')
     AND precio_venta > 0`
);
const [clientes] = await conn.query(
  `SELECT id, nombre FROM clientes WHERE estado = 1 ORDER BY id`
);
const [bodegas] = await conn.query(
  `SELECT id, nombre, principal FROM bodegas WHERE estado = 1 ORDER BY principal DESC, id ASC`
);

if (!productosRows.length || !clientes.length || !bodegas.length) {
  console.error('Faltan productos, clientes o bodegas activas.');
  await conn.end();
  process.exit(1);
}

const productos = new Map(
  productosRows.map((row) => [
    row.id,
    {
      id: row.id,
      sku: row.sku,
      nombre: row.nombre,
      categoria: row.categoria || '',
      precio: money(row.precio_venta),
      tasa: Math.max(0, Number(row.impuesto_porcentaje) || 0) / 100,
    },
  ])
);
const colegios = clientes.filter((cliente) => esColegio(cliente.nombre));
const principal = bodegas[0];
const secundaria = bodegas[1] || bodegas[0];
const rng = mulberry32(20250106);

const documentos = [];
let secuencia = 1;
for (let year = 2025; year <= HASTA.year; year += 1) {
  const mesFinal = year === HASTA.year ? HASTA.month : 12;
  for (let month = 1; month <= mesFinal; month += 1) {
    const diasMes = diasHabiles(year, month, null);
    const dias = diasHabiles(year, month, HASTA);
    if (!dias.length || !diasMes.length) {
      continue;
    }
    const escala = dias.length / diasMes.length;
    const objetivos = objetivosDelMes(rng, productos, year, month, escala);
    const canastas = armarCanastas(rng, objetivos, productos);
    for (const lineas of canastas) {
      const numero = `HST-${pad(secuencia, 6)}`;
      secuencia += 1;
      const day = elegirDia(rng, dias, year, month);
      const cliente = elegirCliente(rng, clientes, colegios, month);
      const bodega = rng() < 0.72 ? principal : secundaria;
      const pagoRoll = rng();
      const metodo = pagoRoll < 0.68 ? 'efectivo' : pagoRoll < 0.88 ? 'tarjeta' : 'transferencia';
      const condicion = rng() < 0.12 ? 'credito' : 'contado';
      let subtotal = 0;
      let itbis = 0;
      for (const linea of lineas) {
        const lineaSubtotal = money(linea.precio_unitario * linea.cantidad);
        linea.subtotal = lineaSubtotal;
        subtotal = money(subtotal + lineaSubtotal);
        itbis = money(itbis + money(lineaSubtotal * linea.tasa));
      }
      documentos.push({
        numero,
        id_cliente: cliente.id,
        fecha: fechaDe(year, month, day, rng),
        metodo_pago: metodo,
        condicion_venta: condicion,
        subtotal,
        itbis,
        total: money(subtotal + itbis),
        id_bodega: bodega.id,
        bodega: bodega.nombre,
        lineas,
      });
    }
  }
}

await conn.beginTransaction();
try {
  await conn.query(`DELETE FROM inventario_movimientos WHERE documento LIKE 'FE HST-%'`);
  await conn.query(`DELETE FROM facturas WHERE numero LIKE 'HST-%'`);

  await insertarLotes(
    conn,
    `INSERT INTO facturas
      (numero, id_cliente, fecha, metodo_pago, condicion_venta, tipo_factura, tributacion,
       archivado, correo_estado, vendedor, moneda, descuento, notas, subtotal, itbis, total, estado)
     VALUES ?`,
    documentos.map((doc) => [
      doc.numero,
      doc.id_cliente,
      doc.fecha,
      doc.metodo_pago,
      doc.condicion_venta,
      'factura',
      doc.fecha < '2026-11-01' ? 'aceptadas' : 'no_entregado',
      0,
      doc.fecha < '2026-11-01' ? 'enviado' : 'no_entregado',
      VENDEDOR,
      'Quetzal',
      0,
      NOTAS,
      doc.subtotal,
      doc.itbis,
      doc.total,
      'emitida',
    ])
  );

  const numeros = documentos.map((doc) => doc.numero);
  const [ids] = await conn.query(`SELECT id, numero FROM facturas WHERE numero IN (?)`, [numeros]);
  const idPorNumero = new Map(ids.map((row) => [row.numero, row.id]));

  const items = [];
  const movimientos = [];
  for (const doc of documentos) {
    const idFactura = idPorNumero.get(doc.numero);
    if (!idFactura) {
      throw new Error(`No se encontró el id de ${doc.numero}`);
    }
    for (const linea of doc.lineas) {
      items.push([
        idFactura,
        linea.id_producto,
        linea.descripcion,
        linea.cantidad,
        linea.precio_unitario,
        linea.subtotal,
      ]);
      movimientos.push([
        doc.fecha,
        'ventas',
        'salida_venta',
        'factura',
        `FE ${doc.numero}`,
        linea.id_producto,
        linea.sku,
        linea.descripcion,
        -linea.cantidad,
        doc.id_bodega,
        doc.bodega,
        VENDEDOR,
      ]);
    }
  }

  await insertarLotes(
    conn,
    `INSERT INTO factura_items
      (id_factura, id_producto, descripcion, cantidad, precio_unitario, subtotal)
     VALUES ?`,
    items
  );
  await insertarLotes(
    conn,
    `INSERT INTO inventario_movimientos
      (fecha, modulo, proceso, documento_origen, documento, id_producto, sku, producto,
       cantidad, id_bodega, bodega, usuario)
     VALUES ?`,
    movimientos,
    400
  );

  await conn.commit();
} catch (error) {
  await conn.rollback();
  console.error(error);
  await conn.end();
  process.exit(1);
}

const [resumen] = await conn.query(
  `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
          COUNT(*) AS facturas,
          ROUND(SUM(total), 2) AS total
   FROM facturas
   WHERE numero LIKE 'HST-%'
   GROUP BY mes
   ORDER BY mes`
);
console.table(resumen.map((row) => ({ mes: row.mes, facturas: Number(row.facturas), total: Number(row.total) })));
console.log(`Facturas nuevas: ${documentos.length}`);
await conn.end();
