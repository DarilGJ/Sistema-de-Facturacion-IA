import {
  Bodega,
  BodegaProducto,
  InventarioTraslado,
  InventarioTrasladoItem,
  Producto,
  sequelize,
} from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { buildTrasladoXlsxBuffer } from '../utils/traslado-xlsx.js';
import { registrarKardex } from '../utils/kardex.js';

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

function money(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function toItemDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  const cantidad = Number(data.cantidad_traslado || 0);
  const precio = money(data.precio_unitario);
  return {
    id: data.id,
    id_producto: data.id_producto,
    sku: data.producto?.sku || '',
    producto: data.producto?.nombre || '',
    cantidad_anterior: Number(data.cantidad_anterior || 0),
    cantidad_traslado: cantidad,
    precio_unitario: precio,
    subtotal: money(precio * cantidad),
  };
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  const items = Array.isArray(data.items) ? data.items.map(toItemDto) : [];
  return {
    id: data.id,
    fecha: data.fecha,
    realizado_por: data.realizado_por,
    estado: data.estado,
    tipo: data.tipo || 'interno',
    id_bodega_origen: data.id_bodega_origen,
    id_bodega_destino: data.id_bodega_destino,
    bodega_origen: data.origen?.nombre || '',
    bodega_destino: data.destino?.nombre || '',
    total_articulos: items.reduce((sum, item) => sum + item.cantidad_traslado, 0),
    total_valor: money(items.reduce((sum, item) => sum + item.subtotal, 0)),
    items,
  };
}

const includeAll = [
  { model: Bodega, as: 'origen', attributes: ['id', 'nombre'] },
  { model: Bodega, as: 'destino', attributes: ['id', 'nombre'] },
  {
    model: InventarioTrasladoItem,
    as: 'items',
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'sku', 'nombre', 'costo_compra'] }],
  },
];

async function findTraslado(id) {
  return InventarioTraslado.findByPk(id, {
    include: includeAll,
    order: [[{ model: InventarioTrasladoItem, as: 'items' }, 'id', 'ASC']],
  });
}

async function stockRow(idBodega, idProducto, transaction) {
  return BodegaProducto.findOne({
    where: { id_bodega: idBodega, id_producto: idProducto },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export async function listar(_req, res) {
  try {
    const rows = await InventarioTraslado.findAll({
      include: includeAll,
      order: [
        ['id', 'DESC'],
        [{ model: InventarioTrasladoItem, as: 'items' }, 'id', 'ASC'],
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
      return res.status(400).json({ message: 'El traslado no es válido' });
    }
    const row = await findTraslado(id);
    if (!row) {
      return res.status(404).json({ message: 'Traslado no encontrado' });
    }
    return res.status(200).json(toDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function descargarExcel(req, res) {
  try {
    const id = asId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: 'El traslado no es válido' });
    }
    const row = await findTraslado(id);
    if (!row) {
      return res.status(404).json({ message: 'Traslado no encontrado' });
    }
    const buffer = buildTrasladoXlsxBuffer(toDto(row));
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="traslado-${id}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).end(buffer);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const idOrigen = asId(req.body?.id_bodega_origen);
    const idDestino = asId(req.body?.id_bodega_destino);
    if (!idOrigen || !idDestino) {
      await t.rollback();
      return res.status(400).json({ message: 'Selecciona bodega de origen y bodega receptora' });
    }
    if (idOrigen === idDestino) {
      await t.rollback();
      return res.status(400).json({ message: 'La bodega de origen y la receptora deben ser distintas' });
    }

    const [origen, destino] = await Promise.all([
      Bodega.findByPk(idOrigen, { transaction: t }),
      Bodega.findByPk(idDestino, { transaction: t }),
    ]);
    if (!origen || !destino) {
      await t.rollback();
      return res.status(404).json({ message: 'Una de las bodegas no existe' });
    }

    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!incoming.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto al traslado' });
    }

    const lineas = [];
    const vistos = new Set();
    for (const item of incoming) {
      const idProducto = asId(item.id_producto);
      const cantidad = asQty(item.cantidad_traslado);
      if (!idProducto || !cantidad) {
        await t.rollback();
        return res.status(400).json({ message: 'Cada línea debe tener producto y una cantidad mayor a 0' });
      }
      if (vistos.has(idProducto)) {
        await t.rollback();
        return res.status(400).json({ message: 'Hay productos duplicados en el traslado' });
      }
      vistos.add(idProducto);
      lineas.push({ idProducto, cantidad });
    }

    const realizados = [];
    for (const linea of lineas) {
      const origenStock = await stockRow(idOrigen, linea.idProducto, t);
      if (!origenStock) {
        await t.rollback();
        return res.status(400).json({ message: 'Solo puedes trasladar productos asignados a la bodega de origen' });
      }
      const anterior = Number(origenStock.cantidad || 0);
      if (anterior < linea.cantidad) {
        await t.rollback();
        return res.status(400).json({
          message: 'No hay existencia suficiente en la bodega de origen para uno de los productos',
        });
      }

      const producto = await Producto.findByPk(linea.idProducto, { transaction: t });
      origenStock.cantidad = anterior - linea.cantidad;
      await origenStock.save({ transaction: t });

      let destinoStock = await stockRow(idDestino, linea.idProducto, t);
      if (!destinoStock) {
        destinoStock = await BodegaProducto.create(
          { id_bodega: idDestino, id_producto: linea.idProducto, cantidad: linea.cantidad },
          { transaction: t }
        );
      } else {
        destinoStock.cantidad = Number(destinoStock.cantidad || 0) + linea.cantidad;
        await destinoStock.save({ transaction: t });
      }

      realizados.push({
        id_producto: linea.idProducto,
        cantidad_anterior: anterior,
        cantidad_traslado: linea.cantidad,
        precio_unitario: money(producto?.costo_compra),
        sku: producto?.sku || '',
        producto: producto?.nombre || '',
      });
    }

    const user = req.user || {};
    const traslado = await InventarioTraslado.create(
      {
        id_bodega_origen: idOrigen,
        id_bodega_destino: idDestino,
        id_usuario: asId(user.sub) || null,
        realizado_por: String(user.nombre || user.email || 'Usuario').trim(),
        fecha: new Date(),
        estado: 'finalizado',
        tipo: 'interno',
      },
      { transaction: t }
    );

    await InventarioTrasladoItem.bulkCreate(
      realizados.map((item) => ({
        id_traslado: traslado.id,
        id_producto: item.id_producto,
        cantidad_anterior: item.cantidad_anterior,
        cantidad_traslado: item.cantidad_traslado,
        precio_unitario: item.precio_unitario,
      })),
      { transaction: t }
    );

    const kardex = [];
    for (const item of realizados) {
      kardex.push({
        fecha: traslado.fecha,
        modulo: 'inventario',
        proceso: 'salida_traslado',
        documento_origen: 'traslado',
        documento: `TRASLADO ${traslado.id}`,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.producto,
        cantidad: -item.cantidad_traslado,
        id_bodega: idOrigen,
        bodega: origen.nombre,
        usuario: traslado.realizado_por,
      });
      kardex.push({
        fecha: traslado.fecha,
        modulo: 'inventario',
        proceso: 'entrada_traslado',
        documento_origen: 'traslado',
        documento: `TRASLADO ${traslado.id}`,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.producto,
        cantidad: item.cantidad_traslado,
        id_bodega: idDestino,
        bodega: destino.nombre,
        usuario: traslado.realizado_por,
      });
    }
    await registrarKardex(kardex, t);

    await recalcStock(
      realizados.map((item) => item.id_producto),
      t
    );
    await t.commit();

    const created = await findTraslado(traslado.id);
    return res.status(201).json(toDto(created));
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}

export async function anular(req, res) {
  const t = await sequelize.transaction();
  try {
    const id = asId(req.params.id);
    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: 'El traslado no es válido' });
    }
    const traslado = await InventarioTraslado.findByPk(id, {
      include: [
        { model: Bodega, as: 'origen', attributes: ['id', 'nombre'] },
        { model: Bodega, as: 'destino', attributes: ['id', 'nombre'] },
        {
          model: InventarioTrasladoItem,
          as: 'items',
          include: [{ model: Producto, as: 'producto', attributes: ['sku', 'nombre'] }],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!traslado) {
      await t.rollback();
      return res.status(404).json({ message: 'Traslado no encontrado' });
    }
    if (traslado.estado === 'anulado') {
      await t.rollback();
      return res.status(400).json({ message: 'Este traslado ya está anulado' });
    }

    for (const item of traslado.items || []) {
      const qty = Number(item.cantidad_traslado || 0);
      const destinoStock = await stockRow(traslado.id_bodega_destino, item.id_producto, t);
      if (!destinoStock || Number(destinoStock.cantidad || 0) < qty) {
        await t.rollback();
        return res.status(400).json({
          message:
            'No se puede anular: la bodega destino ya no tiene suficiente existencia de uno de los productos.',
        });
      }
      destinoStock.cantidad = Number(destinoStock.cantidad) - qty;
      await destinoStock.save({ transaction: t });

      const origenStock = await stockRow(traslado.id_bodega_origen, item.id_producto, t);
      if (!origenStock) {
        await BodegaProducto.create(
          {
            id_bodega: traslado.id_bodega_origen,
            id_producto: item.id_producto,
            cantidad: qty,
          },
          { transaction: t }
        );
      } else {
        origenStock.cantidad = Number(origenStock.cantidad || 0) + qty;
        await origenStock.save({ transaction: t });
      }
    }

    traslado.estado = 'anulado';
    await traslado.save({ transaction: t });
    await registrarKardex(
      (traslado.items || []).flatMap((item) => [
        {
          modulo: 'inventario',
          proceso: 'entrada_traslado_anular',
          documento_origen: 'traslado',
          documento: `ANULACION TRASLADO ${traslado.id}`,
          id_producto: item.id_producto,
          sku: item.producto?.sku || '',
          producto: item.producto?.nombre || '',
          cantidad: Number(item.cantidad_traslado),
          id_bodega: traslado.id_bodega_origen,
          bodega: traslado.origen?.nombre || '',
          usuario: String(req.user?.nombre || req.user?.email || traslado.realizado_por).trim(),
        },
        {
          modulo: 'inventario',
          proceso: 'salida_traslado_anular',
          documento_origen: 'traslado',
          documento: `ANULACION TRASLADO ${traslado.id}`,
          id_producto: item.id_producto,
          sku: item.producto?.sku || '',
          producto: item.producto?.nombre || '',
          cantidad: -Number(item.cantidad_traslado),
          id_bodega: traslado.id_bodega_destino,
          bodega: traslado.destino?.nombre || '',
          usuario: String(req.user?.nombre || req.user?.email || traslado.realizado_por).trim(),
        },
      ]),
      t
    );
    await recalcStock(
      (traslado.items || []).map((item) => item.id_producto),
      t
    );
    await t.commit();

    const updated = await findTraslado(id);
    return res.status(200).json(toDto(updated));
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}
