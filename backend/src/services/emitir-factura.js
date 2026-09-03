import { Cliente, Factura, FacturaItem, Producto } from '../models/index.js';

const ITBIS_RATE = 0.18;

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nextNumero(lastId) {
  return `FAC-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

export async function emitirFactura({ id_cliente, metodo_pago, items, transaction: t }) {
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

  const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
  if (!cliente || !cliente.estado) {
    const error = new Error('El cliente indicado no existe o está inactivo');
    error.status = 400;
    throw error;
  }

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

    const esServicio = String(producto.categoria || '').toLowerCase().includes('servicio');
    if (!esServicio && producto.stock_actual < cantidad) {
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

  const itbis = roundMoney(subtotal * ITBIS_RATE);
  const total = roundMoney(subtotal + itbis);
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
      subtotal,
      itbis,
      total,
      estado: 'emitida',
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

    await linea.producto.update(
      { stock_actual: linea.producto.stock_actual - linea.cantidad },
      { transaction: t }
    );
  }

  return factura;
}
