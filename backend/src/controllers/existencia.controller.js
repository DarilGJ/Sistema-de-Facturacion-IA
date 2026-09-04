import { Bodega, BodegaProducto, Producto, sequelize } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { recalcStock } from '../utils/recalc-stock.js';
import { registrarKardex } from '../utils/kardex.js';

function asId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function asQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.trunc(n));
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    id_bodega: data.id_bodega,
    id_producto: data.id_producto,
    cantidad: Number(data.cantidad || 0),
    sku: data.producto?.sku || '',
    nombre: data.producto?.nombre || '',
  };
}

const includeProducto = {
  model: Producto,
  as: 'producto',
  attributes: ['id', 'sku', 'nombre', 'estado'],
};

export async function listar(req, res) {
  try {
    const idBodega = asId(req.query.id_bodega || req.params.idBodega);
    if (!idBodega) {
      return res.status(400).json({ message: 'La bodega es obligatoria' });
    }
    const rows = await BodegaProducto.findAll({
      where: { id_bodega: idBodega },
      include: [includeProducto],
      order: [[{ model: Producto, as: 'producto' }, 'nombre', 'ASC']],
    });
    return res.status(200).json(rows.map(toDto));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function guardar(req, res) {
  const t = await sequelize.transaction();
  try {
    const idBodega = asId(req.params.idBodega || req.body?.id_bodega);
    if (!idBodega) {
      await t.rollback();
      return res.status(400).json({ message: 'La bodega es obligatoria' });
    }

    const bodega = await Bodega.findByPk(idBodega, { transaction: t });
    if (!bodega) {
      await t.rollback();
      return res.status(404).json({ message: 'Bodega no encontrada' });
    }

    const incoming = Array.isArray(req.body?.productos) ? req.body.productos : [];
    const wanted = new Map();
    for (const item of incoming) {
      const idProducto = asId(item.id_producto);
      if (!idProducto) {
        continue;
      }
      wanted.set(idProducto, asQty(item.cantidad));
    }

    const actuales = await BodegaProducto.findAll({
      where: { id_bodega: idBodega },
      transaction: t,
    });
    const actualesMap = new Map(actuales.map((row) => [row.id_producto, row]));
    const afectados = new Set([...wanted.keys(), ...actualesMap.keys()]);
    const entradas = [];

    for (const row of actuales) {
      if (!wanted.has(row.id_producto)) {
        if (Number(row.cantidad) > 0) {
          await t.rollback();
          return res.status(400).json({
            message:
              'No puedes retirar un producto con existencia. Primero registra un ajuste hasta dejarlo en 0.',
          });
        }
        await row.destroy({ transaction: t });
      }
    }

    for (const [idProducto, cantidad] of wanted.entries()) {
      const existente = actualesMap.get(idProducto);
      if (existente) {
        continue;
      }
      const producto = await Producto.findByPk(idProducto, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(400).json({ message: 'Uno de los productos no existe' });
      }
      await BodegaProducto.create(
        { id_bodega: idBodega, id_producto: idProducto, cantidad },
        { transaction: t }
      );
      if (cantidad > 0) {
        entradas.push({
          id_producto: idProducto,
          sku: producto.sku,
          nombre: producto.nombre,
          cantidad,
        });
      }
    }

    await registrarKardex(
      entradas.map((item) => ({
        modulo: 'inventario',
        proceso: 'entrada_asignacion',
        documento_origen: 'asignacion',
        documento: `ASIGNACION ${bodega.nombre}`,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.nombre,
        cantidad: item.cantidad,
        id_bodega: idBodega,
        bodega: bodega.nombre,
        usuario: String(req.user?.nombre || req.user?.email || 'Usuario').trim(),
      })),
      t
    );

    await recalcStock([...afectados], t);
    await t.commit();

    const rows = await BodegaProducto.findAll({
      where: { id_bodega: idBodega },
      include: [includeProducto],
      order: [[{ model: Producto, as: 'producto' }, 'nombre', 'ASC']],
    });
    return res.status(200).json(rows.map(toDto));
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}
