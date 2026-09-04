import { InventarioMovimiento } from '../models/inventario-movimiento.model.js';

export function usuarioKardex(user) {
  return String(user?.nombre || user?.email || 'Sistema').trim();
}

export async function registrarKardex(entries, transaction) {
  const rows = (Array.isArray(entries) ? entries : []).filter((item) => item && item.cantidad);
  if (!rows.length) {
    return;
  }
  await InventarioMovimiento.bulkCreate(
    rows.map((item) => ({
      fecha: item.fecha || new Date(),
      modulo: item.modulo,
      proceso: item.proceso,
      documento_origen: item.documento_origen,
      documento: item.documento,
      id_producto: item.id_producto || null,
      sku: item.sku || '',
      producto: item.producto,
      cantidad: Number(item.cantidad),
      id_bodega: item.id_bodega || null,
      bodega: item.bodega || '',
      usuario: item.usuario || 'Sistema',
    })),
    { transaction }
  );
}
