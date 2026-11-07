import { Cliente, Factura, FacturaItem, Producto, Bodega, BodegaProducto } from '../models/index.js';
import { getOrCreateInventarioConfig, toInventarioConfigDto } from '../utils/inventario-config.js';
import { registrarKardex } from '../utils/kardex.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { Op } from 'sequelize';

const TIPOS = ['factura', 'factura_especial', 'factura_cambiaria', 'recibo'];

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function nextNumero(lastId) {
  return `FAC-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

function esServicio(producto) {
  return producto.tipo === 'servicio' || String(producto.categoria || '').toLowerCase().includes('servicio');
}

function tasaIva(producto) {
  const pct = Number(producto.impuesto_porcentaje);
  if (!Number.isFinite(pct) || pct < 0) {
    return 0.12;
  }
  return pct / 100;
}

async function descontarProducto(producto, cantidad, factura, user, t) {
  if (cantidad <= 0) {
    return;
  }

  let idBodega = null;
  let bodegaNombre = '';
  let descontado = 0;
  const principal = await Bodega.findOne({
    where: { principal: true, estado: true },
    transaction: t,
  });
  let stock = null;
  if (principal) {
    stock = await BodegaProducto.findOne({
      where: { id_bodega: principal.id, id_producto: producto.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
  }
  if (!stock || Number(stock.cantidad) < cantidad) {
    const otro = await BodegaProducto.findOne({
      where: { id_producto: producto.id, cantidad: { [Op.gte]: cantidad } },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (otro) {
      stock = otro;
    }
  }

  if (stock && Number(stock.cantidad) > 0) {
    const tomar = Math.min(Number(stock.cantidad), cantidad);
    stock.cantidad = Number(stock.cantidad) - tomar;
    await stock.save({ transaction: t });
    descontado = tomar;
    idBodega = stock.id_bodega;
    const bodega = await Bodega.findByPk(idBodega, { transaction: t });
    bodegaNombre = bodega?.nombre || '';
    await recalcStock([producto.id], t);
    await producto.reload({ transaction: t });
  } else {
    const disponible = Math.max(0, Number(producto.stock_actual) || 0);
    const tomar = Math.min(disponible, cantidad);
    if (tomar > 0) {
      await producto.update(
        { stock_actual: disponible - tomar },
        { transaction: t, validate: false }
      );
      descontado = tomar;
    }
  }

  if (descontado > 0) {
    await registrarKardex(
      [
        {
          modulo: 'ventas',
          proceso: 'salida_venta',
          documento_origen: 'factura',
          documento: `FE ${factura.numero}`,
          id_producto: producto.id,
          sku: producto.sku,
          producto: producto.nombre,
          cantidad: -descontado,
          id_bodega: idBodega,
          bodega: bodegaNombre,
          usuario: String(user?.nombre || user?.email || '').trim(),
        },
      ],
      t
    );
  }
}

export async function emitirFactura({
  id_cliente,
  metodo_pago,
  condicion_venta,
  tipo_factura,
  vendedor,
  moneda,
  descuento: descuentoIn,
  notas,
  items,
  fecha,
  user,
  transaction: t,
}) {
  if (!id_cliente) {
    badRequest('El cliente es requerido');
  }

  if (!Array.isArray(items) || items.length === 0) {
    badRequest('Agrega al menos un producto a la factura');
  }

  const metodos = ['efectivo', 'tarjeta', 'transferencia'];
  const pago = metodos.includes(metodo_pago) ? metodo_pago : 'efectivo';
  const condicion = condicion_venta === 'credito' ? 'credito' : 'contado';
  const tipo = TIPOS.includes(tipo_factura) ? tipo_factura : 'factura';
  const descuentoPedido = roundMoney(Math.max(0, Number(descuentoIn) || 0));

  const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
  if (!cliente || !cliente.estado) {
    badRequest('El cliente indicado no existe o está inactivo');
  }

  const config = toInventarioConfigDto(await getOrCreateInventarioConfig(t));
  const grupos = new Map();
  const orden = [];

  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!item.id_producto || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1_000_000) {
      badRequest('Cada línea debe tener producto y cantidad válida');
    }
    const id = Number(item.id_producto);
    if (!grupos.has(id)) {
      grupos.set(id, { cantidad: 0, lineas: [] });
      orden.push(id);
    }
    const grupo = grupos.get(id);
    grupo.cantidad += cantidad;
    grupo.lineas.push(item);
  }

  const lineas = [];
  let subtotal = 0;
  const descuentosPorProducto = [];

  for (const id of orden) {
    const grupo = grupos.get(id);
    const producto = await Producto.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!producto || !producto.estado) {
      badRequest('Uno de los productos no existe o está inactivo');
    }

    const servicio = esServicio(producto);
    const disponible = Math.max(0, Number(producto.stock_actual) || 0);
    if (!servicio && config.bloquear_ventas_sin_stock && disponible < grupo.cantidad) {
      badRequest(`Stock insuficiente para ${producto.nombre}. Disponible: ${disponible}`);
    }

    for (const item of grupo.lineas) {
      const cantidad = Number(item.cantidad);
      const precioOverride = Number(item.precio_unitario);
      const precio =
        Number.isFinite(precioOverride) && precioOverride > 0
          ? roundMoney(precioOverride)
          : roundMoney(producto.precio_venta);
      if (!(precio > 0)) {
        badRequest(`El producto ${producto.nombre} no tiene un precio de venta válido`);
      }
      const lineaSubtotal = roundMoney(precio * cantidad);
      subtotal = roundMoney(subtotal + lineaSubtotal);
      lineas.push({ producto, cantidad, precio, lineaSubtotal, tasa: tasaIva(producto) });
    }

    const aDescontar = servicio ? 0 : Math.min(disponible, grupo.cantidad);
    descuentosPorProducto.push({ producto, cantidad: aDescontar });
  }

  const descuento = roundMoney(Math.min(subtotal, descuentoPedido));
  const gravable = roundMoney(subtotal - descuento);
  let itbis = 0;
  for (const linea of lineas) {
    const parte = subtotal > 0 ? linea.lineaSubtotal / subtotal : 0;
    const base = roundMoney(linea.lineaSubtotal - descuento * parte);
    itbis = roundMoney(itbis + roundMoney(base * linea.tasa));
  }
  const total = roundMoney(gravable + itbis);

  const ultima = await Factura.findOne({
    order: [['id', 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const fechaEmision = fecha ? new Date(fecha) : null;
  const factura = await Factura.create(
    {
      numero: nextNumero(ultima?.id),
      id_cliente,
      ...(fechaEmision && !Number.isNaN(fechaEmision.getTime()) ? { fecha: fechaEmision } : {}),
      metodo_pago: pago,
      condicion_venta: condicion,
      tipo_factura: tipo,
      tributacion: 'no_entregado',
      archivado: false,
      correo_estado: 'no_entregado',
      vendedor: String(vendedor || user?.nombre || '').trim() || null,
      moneda: 'Quetzal',
      descuento,
      autorizacion: null,
      serie: null,
      numero_dte: null,
      notas: notas ? String(notas).trim() : null,
      subtotal: gravable,
      itbis,
      total,
      estado: condicion === 'credito' ? 'pendiente' : 'emitida',
    },
    { transaction: t }
  );

  for (const linea of lineas) {
    await FacturaItem.create(
      {
        id_factura: factura.id,
        id_producto: linea.producto.id,
        descripcion: linea.producto.nombre,
        cantidad: linea.cantidad,
        precio_unitario: linea.precio,
        subtotal: linea.lineaSubtotal,
      },
      { transaction: t }
    );
  }

  for (const mov of descuentosPorProducto) {
    await descontarProducto(mov.producto, mov.cantidad, factura, user, t);
  }

  return factura;
}
