import { BodegaProducto, FacturaItem, InventarioMovimiento, Producto } from '../models/index.js';
import { registrarKardex, usuarioKardex } from '../utils/kardex.js';
import { recalcStock } from '../utils/recalc-stock.js';

/**
 * Devuelve al inventario lo que descontó la venta, usando sus movimientos de kárdex para
 * reintegrar cada cantidad a la misma bodega de la que salió.
 */
export async function revertirInventarioFactura(factura, user, transaction) {
  const salidas = await InventarioMovimiento.findAll({
    where: { proceso: 'salida_venta', documento: `FE ${factura.numero}` },
    transaction,
  });
  const entradas = [];
  const productos = [];

  if (!salidas.length) {
    const items = await FacturaItem.findAll({
      where: { id_factura: factura.id },
      transaction,
    });
    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!cantidad || !item.id_producto) {
        continue;
      }
      const producto = await Producto.findByPk(item.id_producto, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!producto || producto.tipo === 'servicio') {
        continue;
      }
      await producto.update(
        { stock_actual: Number(producto.stock_actual) + cantidad },
        { transaction, validate: false }
      );
      entradas.push({
        modulo: 'ventas',
        proceso: 'entrada_anulacion_venta',
        documento_origen: 'factura',
        documento: `AN ${factura.numero}`,
        id_producto: producto.id,
        sku: producto.sku,
        producto: producto.nombre,
        cantidad,
        id_bodega: null,
        bodega: '',
        usuario: usuarioKardex(user),
      });
    }
    await registrarKardex(entradas, transaction);
    return;
  }

  for (const salida of salidas) {
    const cantidad = Math.abs(Number(salida.cantidad));
    if (!cantidad || !salida.id_producto) {
      continue;
    }
    if (salida.id_bodega) {
      const [stock] = await BodegaProducto.findOrCreate({
        where: { id_bodega: salida.id_bodega, id_producto: salida.id_producto },
        defaults: { cantidad: 0 },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      stock.cantidad = Number(stock.cantidad) + cantidad;
      await stock.save({ transaction });
      productos.push(salida.id_producto);
    } else {
      await Producto.increment('stock_actual', {
        by: cantidad,
        where: { id: salida.id_producto },
        transaction,
      });
    }
    entradas.push({
      modulo: 'ventas',
      proceso: 'entrada_anulacion_venta',
      documento_origen: 'factura',
      documento: `AN ${factura.numero}`,
      id_producto: salida.id_producto,
      sku: salida.sku,
      producto: salida.producto,
      cantidad,
      id_bodega: salida.id_bodega,
      bodega: salida.bodega,
      usuario: usuarioKardex(user),
    });
  }

  await recalcStock(productos, transaction);
  await registrarKardex(entradas, transaction);
}
