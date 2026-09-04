import {
  Bodega,
  BodegaProducto,
  Cliente,
  Factura,
  FacturaItem,
  InventarioDevolucion,
  InventarioDevolucionItem,
  Producto,
  sequelize,
} from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { registrarKardex } from '../utils/kardex.js';

const ITBIS_RATE = 0.18;
const RAZONES = ['danado', 'vencido', 'no_gusto', 'cambio_producto'];
const RESTOCK = {
  danado: false,
  vencido: false,
  no_gusto: true,
  cambio_producto: true,
};

function asId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asQty(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function nextNumero(prefix, lastId) {
  return `${prefix}-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

function asRazon(value) {
  return RAZONES.includes(value) ? value : null;
}

async function stockBodega(idBodega, idProducto, transaction) {
  let stock = await BodegaProducto.findOne({
    where: { id_bodega: idBodega, id_producto: idProducto },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!stock) {
    stock = await BodegaProducto.create(
      { id_bodega: idBodega, id_producto: idProducto, cantidad: 0 },
      { transaction }
    );
  }
  return stock;
}

function toItemDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    id_factura_item: data.id_factura_item,
    id_producto: data.id_producto,
    sku: data.producto?.sku || '',
    producto: data.producto?.nombre || '',
    cantidad: Number(data.cantidad || 0),
    precio_unitario: roundMoney(data.precio_unitario),
    subtotal: roundMoney(data.subtotal),
    restablece_stock: Boolean(data.restablece_stock),
    cantidad_anterior: Number(data.cantidad_anterior || 0),
    cantidad_final: Number(data.cantidad_final || 0),
    id_producto_cambio: data.id_producto_cambio || null,
    sku_cambio: data.producto_cambio?.sku || '',
    producto_cambio: data.producto_cambio?.nombre || '',
    cantidad_cambio: Number(data.cantidad_cambio || 0),
    precio_cambio: roundMoney(data.precio_cambio),
    subtotal_cambio: roundMoney(data.subtotal_cambio),
    cantidad_anterior_cambio:
      data.cantidad_anterior_cambio == null ? null : Number(data.cantidad_anterior_cambio),
    cantidad_final_cambio: data.cantidad_final_cambio == null ? null : Number(data.cantidad_final_cambio),
  };
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  const items = Array.isArray(data.items) ? data.items.map(toItemDto) : [];
  return {
    id: data.id,
    numero: data.numero,
    referencia_nc: data.referencia_nc || '',
    id_factura: data.id_factura,
    factura: data.factura?.numero || '',
    id_cliente: data.id_cliente,
    cliente: data.cliente?.nombre || '',
    id_bodega: data.id_bodega,
    bodega: data.bodega?.nombre || '',
    razon: data.razon,
    resolucion: data.resolucion,
    observacion: data.observacion || '',
    subtotal_devuelto: roundMoney(data.subtotal_devuelto),
    itbis_devuelto: roundMoney(data.itbis_devuelto),
    total_devuelto: roundMoney(data.total_devuelto),
    subtotal_cambio: roundMoney(data.subtotal_cambio),
    itbis_cambio: roundMoney(data.itbis_cambio),
    total_cambio: roundMoney(data.total_cambio),
    diferencia: roundMoney(data.diferencia),
    reembolso: roundMoney(data.reembolso),
    cobro: roundMoney(data.cobro),
    nota_credito_monto: roundMoney(data.nota_credito_monto),
    valor_inventario: roundMoney(data.valor_inventario),
    contabilizado: Boolean(data.contabilizado),
    realizado_por: data.realizado_por,
    fecha: data.fecha,
    items,
  };
}

const includeItems = {
  model: InventarioDevolucionItem,
  as: 'items',
  include: [
    { model: Producto, as: 'producto', attributes: ['id', 'sku', 'nombre'] },
    { model: Producto, as: 'producto_cambio', attributes: ['id', 'sku', 'nombre'] },
  ],
};

async function findDevolucion(id) {
  return InventarioDevolucion.findByPk(id, {
    include: [
      includeItems,
      { model: Factura, as: 'factura', attributes: ['id', 'numero'] },
      { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
      { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
    ],
    order: [[{ model: InventarioDevolucionItem, as: 'items' }, 'id', 'ASC']],
  });
}

async function cantidadesDevueltas(idFactura, transaction) {
  const previas = await InventarioDevolucion.findAll({
    where: { id_factura: idFactura },
    include: [{ model: InventarioDevolucionItem, as: 'items' }],
    transaction,
  });
  const map = new Map();
  for (const doc of previas) {
    for (const row of doc.items || []) {
      map.set(row.id_factura_item, (map.get(row.id_factura_item) || 0) + Number(row.cantidad || 0));
    }
  }
  return map;
}

export async function listar(_req, res) {
  try {
    const rows = await InventarioDevolucion.findAll({
      include: [
        includeItems,
        { model: Factura, as: 'factura', attributes: ['id', 'numero'] },
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
      ],
      order: [
        ['id', 'DESC'],
        [{ model: InventarioDevolucionItem, as: 'items' }, 'id', 'ASC'],
      ],
    });
    return res.status(200).json(rows.map(toDto));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtener(req, res) {
  try {
    const id = asId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'La devolución no es válida' });
    }
    const row = await findDevolucion(id);
    if (!row) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }
    return res.status(200).json(toDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function facturaDisponible(req, res) {
  try {
    const idFactura = asId(req.params.idFactura);
    if (!idFactura) {
      return res.status(400).json({ message: 'La factura no es válida' });
    }
    const factura = await Factura.findByPk(idFactura, {
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre'] },
        {
          model: FacturaItem,
          as: 'items',
          include: [{ model: Producto, as: 'producto', attributes: ['id', 'sku', 'nombre', 'tipo', 'precio_venta'] }],
        },
      ],
    });
    if (!factura || factura.estado !== 'emitida') {
      return res.status(404).json({ message: 'Factura no encontrada o no está emitida' });
    }
    const yaDevuelto = await cantidadesDevueltas(idFactura);
    return res.status(200).json({
      id: factura.id,
      numero: factura.numero,
      fecha: factura.fecha,
      metodo_pago: factura.metodo_pago,
      id_cliente: factura.id_cliente,
      cliente: factura.cliente?.nombre || '',
      items: (factura.items || []).map((item) => {
        const vendida = Number(item.cantidad || 0);
        const devuelta = yaDevuelto.get(item.id) || 0;
        const disponible = Math.max(0, vendida - devuelta);
        return {
          id_factura_item: item.id,
          id_producto: item.id_producto,
          sku: item.producto?.sku || '',
          producto: item.producto?.nombre || item.descripcion,
          tipo: item.producto?.tipo || 'producto',
          cantidad_vendida: vendida,
          cantidad_devuelta: devuelta,
          cantidad_disponible: disponible,
          precio_unitario: roundMoney(item.precio_unitario),
          precio_venta: roundMoney(item.producto?.precio_venta),
        };
      }),
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const idFactura = asId(req.body?.id_factura);
    const idBodega = asId(req.body?.id_bodega);
    const razon = asRazon(req.body?.razon);
    if (!idFactura || !idBodega || !razon) {
      await t.rollback();
      return res.status(400).json({ message: 'Selecciona factura, bodega y razón de devolución' });
    }

    const esCambio = razon === 'cambio_producto';
    let resolucion = String(req.body?.resolucion || '');
    if (esCambio) {
      resolucion = 'cambio';
    } else if (resolucion !== 'reembolso_efectivo' && resolucion !== 'nota_credito') {
      await t.rollback();
      return res.status(400).json({
        message: 'Indica si el cliente recibe reembolso en efectivo o una nota de crédito',
      });
    }

    const factura = await Factura.findByPk(idFactura, {
      include: [{ model: FacturaItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!factura || factura.estado !== 'emitida') {
      await t.rollback();
      return res.status(400).json({ message: 'Solo puedes devolver mercancía de una factura emitida' });
    }

    const bodega = await Bodega.findByPk(idBodega, { transaction: t });
    if (!bodega || !bodega.estado) {
      await t.rollback();
      return res.status(400).json({ message: 'La bodega indicada no existe o está inactiva' });
    }

    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!incoming.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto a devolver' });
    }

    const yaDevuelto = await cantidadesDevueltas(idFactura, t);
    const facturaItems = new Map((factura.items || []).map((item) => [item.id, item]));
    const vistos = new Set();
    const lineas = [];
    const restablece = RESTOCK[razon];

    for (const item of incoming) {
      const idFacturaItem = asId(item.id_factura_item);
      const cantidad = asQty(item.cantidad);
      if (!idFacturaItem || !cantidad) {
        await t.rollback();
        return res.status(400).json({ message: 'Cada línea debe tener producto y cantidad mayor a 0' });
      }
      if (vistos.has(idFacturaItem)) {
        await t.rollback();
        return res.status(400).json({ message: 'Hay productos duplicados en la devolución' });
      }
      vistos.add(idFacturaItem);

      const facturaItem = facturaItems.get(idFacturaItem);
      if (!facturaItem) {
        await t.rollback();
        return res.status(400).json({ message: 'Uno de los productos no pertenece a la factura' });
      }

      const disponible = Math.max(0, Number(facturaItem.cantidad) - (yaDevuelto.get(idFacturaItem) || 0));
      if (cantidad > disponible) {
        await t.rollback();
        return res.status(400).json({
          message: `La cantidad a devolver supera lo vendido. Disponible: ${disponible}`,
        });
      }

      const producto = await Producto.findByPk(facturaItem.id_producto, { transaction: t });
      const esServicio =
        producto?.tipo === 'servicio' || String(producto?.categoria || '').toLowerCase().includes('servicio');

      let cambio = null;
      if (esCambio) {
        const idProductoCambio = asId(item.id_producto_cambio);
        const cantidadCambio = asQty(item.cantidad_cambio) || cantidad;
        if (!idProductoCambio) {
          await t.rollback();
          return res.status(400).json({
            message: 'En un cambio de producto debes indicar el artículo que se entrega al cliente',
          });
        }
        const productoCambio = await Producto.findByPk(idProductoCambio, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!productoCambio || !productoCambio.estado) {
          await t.rollback();
          return res.status(400).json({ message: 'El producto de cambio no existe o está inactivo' });
        }
        const precioOverride = Number(item.precio_cambio);
        const precioCambio =
          Number.isFinite(precioOverride) && precioOverride >= 0
            ? roundMoney(precioOverride)
            : roundMoney(productoCambio.precio_venta);
        cambio = {
          producto: productoCambio,
          cantidad: cantidadCambio,
          precio: precioCambio,
          subtotal: roundMoney(precioCambio * cantidadCambio),
        };
      }

      lineas.push({
        facturaItem,
        producto,
        esServicio,
        cantidad,
        precio: roundMoney(facturaItem.precio_unitario),
        subtotal: roundMoney(roundMoney(facturaItem.precio_unitario) * cantidad),
        cambio,
      });
    }

    const subtotalDevuelto = roundMoney(lineas.reduce((sum, item) => sum + item.subtotal, 0));
    const itbisDevuelto = roundMoney(subtotalDevuelto * ITBIS_RATE);
    const totalDevuelto = roundMoney(subtotalDevuelto + itbisDevuelto);
    const subtotalCambio = roundMoney(lineas.reduce((sum, item) => sum + (item.cambio?.subtotal || 0), 0));
    const itbisCambio = roundMoney(subtotalCambio * ITBIS_RATE);
    const totalCambio = roundMoney(subtotalCambio + itbisCambio);
    const diferencia = roundMoney(totalCambio - totalDevuelto);

    let reembolso = 0;
    let cobro = 0;
    let notaCreditoMonto = 0;
    if (resolucion === 'reembolso_efectivo') {
      reembolso = totalDevuelto;
    } else if (resolucion === 'nota_credito') {
      notaCreditoMonto = totalDevuelto;
    } else if (diferencia > 0) {
      cobro = diferencia;
    } else if (diferencia < 0) {
      reembolso = roundMoney(-diferencia);
    }

    const ultima = await InventarioDevolucion.findOne({
      order: [['id', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    const numero = nextNumero('DEV', ultima?.id);
    const referenciaNc = resolucion === 'nota_credito' || notaCreditoMonto > 0 ? nextNumero('NC', ultima?.id) : null;

    const user = req.user || {};
    const realizados = [];
    const kardex = [];
    const productosAfectados = new Set();
    let valorInventario = 0;

    for (const linea of lineas) {
      let cantidadAnterior = 0;
      let cantidadFinal = 0;
      const aplicaEntrada = restablece && !linea.esServicio;
      if (!linea.esServicio) {
        const stock = await stockBodega(idBodega, linea.producto.id, t);
        cantidadAnterior = Number(stock.cantidad || 0);
        cantidadFinal = cantidadAnterior;
        if (aplicaEntrada) {
          cantidadFinal = cantidadAnterior + linea.cantidad;
          stock.cantidad = cantidadFinal;
          await stock.save({ transaction: t });
          valorInventario = roundMoney(valorInventario + roundMoney(linea.producto.costo_compra) * linea.cantidad);
          kardex.push({
            proceso: 'entrada_devolucion',
            id_producto: linea.producto.id,
            sku: linea.producto.sku,
            producto: linea.producto.nombre,
            cantidad: linea.cantidad,
          });
        }
        productosAfectados.add(linea.producto.id);
      }

      let cantidadAnteriorCambio = null;
      let cantidadFinalCambio = null;
      if (linea.cambio && linea.cambio.producto.tipo !== 'servicio') {
        const stockCambio = await stockBodega(idBodega, linea.cambio.producto.id, t);
        cantidadAnteriorCambio = Number(stockCambio.cantidad || 0);
        cantidadFinalCambio = cantidadAnteriorCambio - linea.cambio.cantidad;
        if (cantidadFinalCambio < 0) {
          await t.rollback();
          return res.status(400).json({
            message: `Stock insuficiente para entregar ${linea.cambio.producto.nombre}. Disponible: ${cantidadAnteriorCambio}`,
          });
        }
        stockCambio.cantidad = cantidadFinalCambio;
        await stockCambio.save({ transaction: t });
        valorInventario = roundMoney(
          valorInventario - roundMoney(linea.cambio.producto.costo_compra) * linea.cambio.cantidad
        );
        productosAfectados.add(linea.cambio.producto.id);
        kardex.push({
          proceso: 'salida_devolucion',
          id_producto: linea.cambio.producto.id,
          sku: linea.cambio.producto.sku,
          producto: linea.cambio.producto.nombre,
          cantidad: -linea.cambio.cantidad,
        });
      }

      realizados.push({
        id_factura_item: linea.facturaItem.id,
        id_producto: linea.producto.id,
        cantidad: linea.cantidad,
        precio_unitario: linea.precio,
        subtotal: linea.subtotal,
        restablece_stock: aplicaEntrada,
        cantidad_anterior: cantidadAnterior,
        cantidad_final: cantidadFinal,
        id_producto_cambio: linea.cambio?.producto.id || null,
        cantidad_cambio: linea.cambio?.cantidad || 0,
        precio_cambio: linea.cambio?.precio || 0,
        subtotal_cambio: linea.cambio?.subtotal || 0,
        cantidad_anterior_cambio: cantidadAnteriorCambio,
        cantidad_final_cambio: cantidadFinalCambio,
      });
    }

    const devolucion = await InventarioDevolucion.create(
      {
        numero,
        referencia_nc: referenciaNc,
        id_factura: factura.id,
        id_cliente: factura.id_cliente,
        id_bodega: idBodega,
        razon,
        resolucion,
        observacion: String(req.body?.observacion || '').trim() || null,
        subtotal_devuelto: subtotalDevuelto,
        itbis_devuelto: itbisDevuelto,
        total_devuelto: totalDevuelto,
        subtotal_cambio: subtotalCambio,
        itbis_cambio: itbisCambio,
        total_cambio: totalCambio,
        diferencia,
        reembolso,
        cobro,
        nota_credito_monto: notaCreditoMonto,
        valor_inventario: valorInventario,
        contabilizado: false,
        id_usuario: asId(user.sub) || null,
        realizado_por: String(user.nombre || user.email || 'Usuario').trim(),
        fecha: new Date(),
      },
      { transaction: t }
    );

    await InventarioDevolucionItem.bulkCreate(
      realizados.map((item) => ({ ...item, id_devolucion: devolucion.id })),
      { transaction: t }
    );

    const documentoOrigen = referenciaNc ? 'nota_credito' : 'devolucion';
    const documento = referenciaNc ? `NC ${referenciaNc}` : `DEV ${numero}`;
    await registrarKardex(
      kardex.map((item) => ({
        fecha: devolucion.fecha,
        modulo: 'inventario',
        proceso: item.proceso,
        documento_origen: documentoOrigen,
        documento,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.producto,
        cantidad: item.cantidad,
        id_bodega: idBodega,
        bodega: bodega.nombre,
        usuario: devolucion.realizado_por,
      })),
      t
    );

    await recalcStock([...productosAfectados], t);
    await t.commit();

    const created = await findDevolucion(devolucion.id);
    return res.status(201).json(toDto(created));
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}
