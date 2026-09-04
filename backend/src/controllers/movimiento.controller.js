import { Op } from 'sequelize';
import { InventarioMovimiento } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { ensureKardexBackfill } from '../utils/kardex-backfill.js';

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    fecha: data.fecha,
    modulo: data.modulo,
    proceso: data.proceso,
    documento_origen: data.documento_origen,
    documento: data.documento,
    sku: data.sku,
    producto: data.producto,
    cantidad: Number(data.cantidad),
    bodega: data.bodega,
    usuario: data.usuario,
  };
}

export async function listar(req, res) {
  try {
    await ensureKardexBackfill();
    const page = Math.max(1, Number(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
    const q = String(req.query.q || '').trim();
    const proceso = String(req.query.proceso || '').trim();
    const documentoOrigen = String(req.query.documento_origen || '').trim();
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    const where = {};
    if (proceso) {
      where.proceso = proceso;
    }
    if (documentoOrigen) {
      where.documento_origen = documentoOrigen;
    }
    if (desde && !Number.isNaN(desde.getTime()) && hasta && !Number.isNaN(hasta.getTime())) {
      const end = new Date(hasta);
      end.setHours(23, 59, 59, 999);
      where.fecha = { [Op.between]: [desde, end] };
    } else if (desde && !Number.isNaN(desde.getTime())) {
      where.fecha = { [Op.gte]: desde };
    } else if (hasta && !Number.isNaN(hasta.getTime())) {
      const end = new Date(hasta);
      end.setHours(23, 59, 59, 999);
      where.fecha = { [Op.lte]: end };
    }
    if (q) {
      where[Op.or] = [
        { producto: { [Op.like]: `%${q}%` } },
        { sku: { [Op.like]: `%${q}%` } },
        { documento: { [Op.like]: `%${q}%` } },
        { usuario: { [Op.like]: `%${q}%` } },
        { bodega: { [Op.like]: `%${q}%` } },
        { modulo: { [Op.like]: `%${q}%` } },
        { proceso: { [Op.like]: `%${q}%` } },
      ];
    }

    const { rows, count } = await InventarioMovimiento.findAndCountAll({
      where,
      order: [
        ['fecha', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (page - 1) * size,
      limit: size,
    });

    return res.status(200).json({
      rows: rows.map(toDto),
      total: count,
      page,
      size,
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
