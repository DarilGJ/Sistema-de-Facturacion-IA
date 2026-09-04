import { Op } from 'sequelize';
import {
  Bodega,
  Factura,
  FacturaItem,
  InventarioAjuste,
  InventarioAjusteItem,
  InventarioMovimiento,
  InventarioTraslado,
  InventarioTrasladoItem,
  Producto,
} from '../models/index.js';
import { registrarKardex } from './kardex.js';

async function yaExiste(documento) {
  const n = await InventarioMovimiento.count({ where: { documento } });
  return n > 0;
}

export async function backfillKardex() {
  const ajustes = await InventarioAjuste.findAll({
    include: [
      {
        model: InventarioAjusteItem,
        as: 'items',
        include: [
          { model: Producto, as: 'producto', attributes: ['sku', 'nombre'] },
          { model: Bodega, as: 'bodega', attributes: ['nombre'] },
        ],
      },
    ],
  });
  for (const ajuste of ajustes) {
    const documento = `AJUSTE ${ajuste.id}`;
    if (await yaExiste(documento)) {
      continue;
    }
    await registrarKardex(
      (ajuste.items || []).map((item) => ({
        fecha: ajuste.fecha,
        modulo: 'inventario',
        proceso: item.tipo === 'menos' ? 'salida_ajuste' : 'entrada_ajuste',
        documento_origen: 'ajuste',
        documento,
        id_producto: item.id_producto,
        sku: item.producto?.sku || '',
        producto: item.producto?.nombre || '',
        cantidad: item.tipo === 'menos' ? -Number(item.cantidad_ajuste) : Number(item.cantidad_ajuste),
        id_bodega: item.id_bodega,
        bodega: item.bodega?.nombre || '',
        usuario: ajuste.realizado_por,
      }))
    );
  }

  const traslados = await InventarioTraslado.findAll({
    include: [
      { model: Bodega, as: 'origen', attributes: ['nombre'] },
      { model: Bodega, as: 'destino', attributes: ['nombre'] },
      {
        model: InventarioTrasladoItem,
        as: 'items',
        include: [{ model: Producto, as: 'producto', attributes: ['sku', 'nombre'] }],
      },
    ],
  });
  for (const traslado of traslados) {
    const documento = `TRASLADO ${traslado.id}`;
    if (await yaExiste(documento)) {
      continue;
    }
    const anulado = traslado.estado === 'anulado';
    const entries = [];
    for (const item of traslado.items || []) {
      entries.push({
        fecha: traslado.fecha,
        modulo: 'inventario',
        proceso: 'salida_traslado',
        documento_origen: 'traslado',
        documento,
        id_producto: item.id_producto,
        sku: item.producto?.sku || '',
        producto: item.producto?.nombre || '',
        cantidad: -Number(item.cantidad_traslado),
        id_bodega: traslado.id_bodega_origen,
        bodega: traslado.origen?.nombre || '',
        usuario: traslado.realizado_por,
      });
      entries.push({
        fecha: traslado.fecha,
        modulo: 'inventario',
        proceso: 'entrada_traslado',
        documento_origen: 'traslado',
        documento,
        id_producto: item.id_producto,
        sku: item.producto?.sku || '',
        producto: item.producto?.nombre || '',
        cantidad: Number(item.cantidad_traslado),
        id_bodega: traslado.id_bodega_destino,
        bodega: traslado.destino?.nombre || '',
        usuario: traslado.realizado_por,
      });
    }
    await registrarKardex(entries);
    if (anulado) {
      await registrarKardex(
        entries.map((item) => ({
          ...item,
          proceso: item.proceso === 'salida_traslado' ? 'entrada_traslado_anular' : 'salida_traslado_anular',
          cantidad: -item.cantidad,
          documento: `ANULACION ${documento}`,
        }))
      );
    }
  }

  const facturas = await Factura.findAll({
    where: { estado: { [Op.ne]: 'anulada' } },
    include: [
      {
        model: FacturaItem,
        as: 'items',
        include: [{ model: Producto, as: 'producto', attributes: ['sku', 'tipo', 'categoria'] }],
      },
    ],
  });
  for (const factura of facturas) {
    const documento = `FE ${factura.numero}`;
    if (await yaExiste(documento)) {
      continue;
    }
    await registrarKardex(
      (factura.items || [])
        .filter((item) => {
          const tipo = item.producto?.tipo;
          const cat = String(item.producto?.categoria || '').toLowerCase();
          return tipo !== 'servicio' && !cat.includes('servicio');
        })
        .map((item) => ({
          fecha: factura.fecha,
          modulo: 'ventas',
          proceso: 'salida_venta',
          documento_origen: 'factura',
          documento,
          id_producto: item.id_producto,
          sku: item.producto?.sku || '',
          producto: item.descripcion,
          cantidad: -Number(item.cantidad),
          bodega: '',
          usuario: '',
        }))
    );
  }
}

let backfillJob = null;
export function ensureKardexBackfill() {
  if (!backfillJob) {
    backfillJob = backfillKardex().catch((error) => {
      console.warn('No se pudo completar el backfill de bitácora:', error.message);
      backfillJob = null;
    });
  }
  return backfillJob;
}
