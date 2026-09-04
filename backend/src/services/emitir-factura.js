import { Cliente, Factura, FacturaItem, Producto, Bodega, BodegaProducto } from '../models/index.js';
import { getOrCreateInventarioConfig, toInventarioConfigDto } from '../utils/inventario-config.js';
import { registrarKardex } from '../utils/kardex.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';

const ITBIS_RATE = 0.18;

const TIPOS = ['factura', 'factura_especial', 'factura_cambiaria', 'recibo'];

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nextNumero(lastId) {
  return `FAC-${String((lastId || 0) + 1).padStart(6, '0')}`;
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
  user,
  transaction: t,
}) {
  if (!id_cliente) {
    const error = new Error('El cliente es requerido');
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Agrega al menos un producto a la factura');
    error.status = 400;
    throw error;
  }

  const metodos = ['efectivo', 'tarjeta', 'transferencia'];
  const pago = metodos.includes(metodo_pago) ? metodo_pago : 'efectivo';
  const condicion = condicion_venta === 'credito' ? 'credito' : 'contado';
  const tipo = TIPOS.includes(tipo_factura) ? tipo_factura : 'factura';
  const descuentoPedido = roundMoney(Math.max(0, Number(descuentoIn) || 0));

  const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
  if (!cliente || !cliente.estado) {
    const error = new Error('El cliente indicado no existe o está inactivo');
    error.status = 400;
    throw error;
  }

  const config = toInventarioConfigDto(await getOrCreateInventarioConfig());
  const lineas = [];
  let subtotal = 0;

  for (const item of items) {
    const cantidad = Number(item.cantidad);
    if (!item.id_producto || !Number.isInteger(cantidad) || cantidad < 1) {
      const error = new Error('Cada línea debe tener producto y cantidad válida');
      error.status = 400;
      throw error;
    }

    const producto = await Producto.findByPk(item.id_producto, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!producto || !producto.estado) {
      const error = new Error('Uno de los productos no existe o está inactivo');
      error.status = 400;
      throw error;
    }

    const esServicio =
      producto.tipo === 'servicio' || String(producto.categoria || '').toLowerCase().includes('servicio');
    if (
      config.bloquear_ventas_sin_stock &&
      !esServicio &&
      producto.stock_actual < cantidad
    ) {
      const error = new Error(
        `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}`
      );
      error.status = 400;
      throw error;
    }

    const precioOverride = Number(item.precio_unitario);
    const precio =
      Number.isFinite(precioOverride) && precioOverride >= 0
        ? roundMoney(precioOverride)
        : roundMoney(producto.precio_venta);
    const lineaSubtotal = roundMoney(precio * cantidad);
    subtotal = roundMoney(subtotal + lineaSubtotal);

    lineas.push({ producto, cantidad, precio, lineaSubtotal });
  }

  const descuento = roundMoney(Math.min(subtotal, descuentoPedido));
  const gravable = roundMoney(subtotal - descuento);
  const itbis = roundMoney(gravable * ITBIS_RATE);
  const total = roundMoney(gravable + itbis);
  const autorizacion = randomUUID().toUpperCase();
  const serie = autorizacion.replace(/-/g, '').slice(0, 8);
  const ultima = await Factura.findOne({
    order: [['id', 'DESC']],
    transaction: t,
    lock: t.LOCK.UPDATE,
  });

  const factura = await Factura.create(
    {
      numero: nextNumero(ultima?.id),
      id_cliente,
      metodo_pago: pago,
      condicion_venta: condicion,
      tipo_factura: tipo,
      tributacion: 'desconocido',
      archivado: false,
      correo_estado: 'no_entregado',
      vendedor: String(vendedor || user?.nombre || '').trim() || null,
      moneda: String(moneda || 'Quetzal').trim() || 'Quetzal',
      descuento,
      autorizacion,
      serie,
      notas: notas ? String(notas).trim() : null,
      subtotal: gravable,
      itbis,
      total,
      estado: condicion === 'credito' ? 'pendiente' : 'emitida',
    },
    { transaction: t }
  );
  factura.numero_dte = String(factura.id).padStart(10, '0');
  await factura.save({ transaction: t });

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

    const esServicio =
      linea.producto.tipo === 'servicio' ||
      String(linea.producto.categoria || '').toLowerCase().includes('servicio');
    if (!esServicio) {
      let idBodega = null;
      let bodegaNombre = '';
      const principal = await Bodega.findOne({
        where: { principal: true, estado: true },
        transaction: t,
      });
      let stock = null;
      if (principal) {
        stock = await BodegaProducto.findOne({
          where: { id_bodega: principal.id, id_producto: linea.producto.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }
      if (!stock || Number(stock.cantidad) < linea.cantidad) {
        const otro = await BodegaProducto.findOne({
          where: { id_producto: linea.producto.id, cantidad: { [Op.gte]: linea.cantidad } },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (otro) {
          stock = otro;
        }
      }
      if (stock && Number(stock.cantidad) >= linea.cantidad) {
        stock.cantidad = Number(stock.cantidad) - linea.cantidad;
        await stock.save({ transaction: t });
        idBodega = stock.id_bodega;
        const bodega = await Bodega.findByPk(idBodega, { transaction: t });
        bodegaNombre = bodega?.nombre || '';
        await recalcStock([linea.producto.id], t);
      } else {
        await linea.producto.update(
          { stock_actual: linea.producto.stock_actual - linea.cantidad },
          { transaction: t, validate: false }
        );
      }
      await registrarKardex(
        [
          {
            modulo: 'ventas',
            proceso: 'salida_venta',
            documento_origen: 'factura',
            documento: `FE ${factura.numero}`,
            id_producto: linea.producto.id,
            sku: linea.producto.sku,
            producto: linea.producto.nombre,
            cantidad: -linea.cantidad,
            id_bodega: idBodega,
            bodega: bodegaNombre,
            usuario: String(user?.nombre || user?.email || '').trim(),
          },
        ],
        t
      );
    }
  }

  return factura;
}
