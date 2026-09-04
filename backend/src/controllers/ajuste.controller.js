import {
  Bodega,
  BodegaProducto,
  InventarioAjuste,
  InventarioAjusteItem,
  Producto,
  sequelize,
} from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { buildAjusteXlsxBuffer } from '../utils/ajuste-xlsx.js';
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

function asTipo(value) {
  return value === 'menos' ? 'menos' : value === 'mas' ? 'mas' : null;
}

function toItemDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    id_bodega: data.id_bodega,
    id_producto: data.id_producto,
    sku: data.producto?.sku || '',
    producto: data.producto?.nombre || '',
    bodega: data.bodega?.nombre || '',
    cantidad_anterior: Number(data.cantidad_anterior || 0),
    tipo: data.tipo,
    cantidad_ajuste: Number(data.cantidad_ajuste || 0),
    cantidad_final: Number(data.cantidad_final || 0),
  };
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  const items = Array.isArray(data.items) ? data.items.map(toItemDto) : [];
  return {
    id: data.id,
    descripcion: data.descripcion || '',
    id_usuario: data.id_usuario || null,
    realizado_por: data.realizado_por,
    fecha: data.fecha,
    contabilizado: Boolean(data.contabilizado),
    items,
  };
}

const includeItems = {
  model: InventarioAjusteItem,
  as: 'items',
  include: [
    { model: Producto, as: 'producto', attributes: ['id', 'sku', 'nombre'] },
    { model: Bodega, as: 'bodega', attributes: ['id', 'nombre'] },
  ],
};

async function findAjuste(id) {
  return InventarioAjuste.findByPk(id, {
    include: [includeItems],
    order: [[{ model: InventarioAjusteItem, as: 'items' }, 'id', 'ASC']],
  });
}

export async function listar(_req, res) {
  try {
    const rows = await InventarioAjuste.findAll({
      include: [includeItems],
      order: [
        ['id', 'DESC'],
        [{ model: InventarioAjusteItem, as: 'items' }, 'id', 'ASC'],
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
      return res.status(400).json({ message: 'El ajuste no es válido' });
    }
    const row = await findAjuste(id);
    if (!row) {
      return res.status(404).json({ message: 'Ajuste no encontrado' });
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
      return res.status(400).json({ message: 'El ajuste no es válido' });
    }
    const row = await findAjuste(id);
    if (!row) {
      return res.status(404).json({ message: 'Ajuste no encontrado' });
    }
    const buffer = buildAjusteXlsxBuffer(toDto(row));
    const filename = `ajuste-${id}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).end(buffer);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const incoming = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!incoming.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto al ajuste' });
    }

    const descripcion = String(req.body?.descripcion || '').trim();
    const lineas = [];
    const vistos = new Set();

    for (const item of incoming) {
      const idBodega = asId(item.id_bodega);
      const idProducto = asId(item.id_producto);
      const tipo = asTipo(item.tipo);
      const cantidadAjuste = asQty(item.cantidad_ajuste);
      if (!idBodega || !idProducto || !tipo || !cantidadAjuste) {
        await t.rollback();
        return res.status(400).json({
          message: 'Cada línea debe tener bodega, producto, tipo y una cantidad mayor a 0',
        });
      }
      const key = `${idBodega}:${idProducto}`;
      if (vistos.has(key)) {
        await t.rollback();
        return res.status(400).json({ message: 'Hay productos duplicados en el ajuste' });
      }
      vistos.add(key);
      lineas.push({ idBodega, idProducto, tipo, cantidadAjuste });
    }

    const realizados = [];
    for (const linea of lineas) {
      const stock = await BodegaProducto.findOne({
        where: { id_bodega: linea.idBodega, id_producto: linea.idProducto },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!stock) {
        await t.rollback();
        return res.status(400).json({
          message: 'Solo puedes ajustar productos ya asignados a la bodega',
        });
      }

      const cantidadAnterior = Number(stock.cantidad || 0);
      const delta = linea.tipo === 'mas' ? linea.cantidadAjuste : -linea.cantidadAjuste;
      const cantidadFinal = cantidadAnterior + delta;
      if (cantidadFinal < 0) {
        await t.rollback();
        return res.status(400).json({
          message: 'La existencia no puede quedar negativa. Reduce la cantidad de ajuste.',
        });
      }

      const [producto, bodega] = await Promise.all([
        Producto.findByPk(linea.idProducto, { transaction: t }),
        Bodega.findByPk(linea.idBodega, { transaction: t }),
      ]);

      stock.cantidad = cantidadFinal;
      await stock.save({ transaction: t });
      realizados.push({
        id_bodega: linea.idBodega,
        id_producto: linea.idProducto,
        cantidad_anterior: cantidadAnterior,
        tipo: linea.tipo,
        cantidad_ajuste: linea.cantidadAjuste,
        cantidad_final: cantidadFinal,
        sku: producto?.sku || '',
        producto: producto?.nombre || '',
        bodega: bodega?.nombre || '',
      });
    }

    const user = req.user || {};
    const ajuste = await InventarioAjuste.create(
      {
        descripcion: descripcion || null,
        id_usuario: asId(user.sub) || null,
        realizado_por: String(user.nombre || user.email || 'Usuario').trim(),
        fecha: new Date(),
        contabilizado: false,
      },
      { transaction: t }
    );

    await InventarioAjusteItem.bulkCreate(
      realizados.map((item) => ({
        id_ajuste: ajuste.id,
        id_bodega: item.id_bodega,
        id_producto: item.id_producto,
        cantidad_anterior: item.cantidad_anterior,
        tipo: item.tipo,
        cantidad_ajuste: item.cantidad_ajuste,
        cantidad_final: item.cantidad_final,
      })),
      { transaction: t }
    );

    await registrarKardex(
      realizados.map((item) => ({
        fecha: ajuste.fecha,
        modulo: 'inventario',
        proceso: item.tipo === 'menos' ? 'salida_ajuste' : 'entrada_ajuste',
        documento_origen: 'ajuste',
        documento: `AJUSTE ${ajuste.id}`,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.producto,
        cantidad: item.tipo === 'menos' ? -item.cantidad_ajuste : item.cantidad_ajuste,
        id_bodega: item.id_bodega,
        bodega: item.bodega,
        usuario: ajuste.realizado_por,
      })),
      t
    );

    await recalcStock(
      realizados.map((item) => item.id_producto),
      t
    );
    await t.commit();

    const created = await findAjuste(ajuste.id);
    return res.status(201).json(toDto(created));
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}
