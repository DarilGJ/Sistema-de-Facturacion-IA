import { BodegaProducto, Producto } from '../models/index.js';

export async function recalcStock(productIds, transaction) {
  const ids = [...new Set((productIds || []).filter(Boolean))];
  for (const idProducto of ids) {
    const total = await BodegaProducto.sum('cantidad', {
      where: { id_producto: idProducto },
      transaction,
    });
    await Producto.update(
      { stock_actual: Number(total || 0) },
      { where: { id: idProducto }, transaction, validate: false }
    );
  }
}
