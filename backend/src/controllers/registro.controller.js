import { Registro } from '../models/registro.model.js';
import { handleSequelizeError } from '../utils/http-error.js';

const TIPOS = new Set([
  'gasto_tipo',
  'gasto',
  'anticipo',
  'recurrente',
  'caja',
  'nota_debito',
  'empresa',
]);

function asTipo(value) {
  const tipo = String(value || '').trim();
  return TIPOS.has(tipo) ? tipo : null;
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    ...data,
    monto: Number(data.monto || 0),
    activo: Boolean(data.activo),
  };
}

export async function listar(req, res) {
  try {
    const tipo = asTipo(req.query.tipo);
    if (!tipo) {
      return res.status(400).json({ message: 'Indica un tipo de registro válido' });
    }
    const rows = await Registro.findAll({
      where: { tipo, activo: true },
      order: [['id', 'DESC']],
    });
    return res.status(200).json(rows.map(toDto));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  try {
    const tipo = asTipo(req.body?.tipo);
    const nombre = String(req.body?.nombre || '').trim();
    if (!tipo || !nombre) {
      return res.status(400).json({ message: 'Tipo y nombre son requeridos' });
    }
    const monto = Number(req.body?.monto ?? 0);
    if (!Number.isFinite(monto) || monto < 0) {
      return res.status(400).json({ message: 'El monto no puede ser negativo' });
    }
    const fecha = req.body?.fecha ? new Date(req.body.fecha) : new Date();
    const row = await Registro.create({
      tipo,
      nombre,
      referencia: String(req.body?.referencia || '').trim() || null,
      monto,
      fecha: Number.isNaN(fecha.getTime()) ? new Date() : fecha,
      estado: String(req.body?.estado || 'activo').trim() || 'activo',
      detalle: String(req.body?.detalle || '').trim() || null,
      activo: true,
    });
    return res.status(201).json(toDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const row = await Registro.findByPk(req.params.id);
    if (!row || !row.activo) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    const nombre = req.body?.nombre !== undefined ? String(req.body.nombre).trim() : row.nombre;
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }
    const monto = req.body?.monto !== undefined ? Number(req.body.monto) : Number(row.monto);
    if (!Number.isFinite(monto) || monto < 0) {
      return res.status(400).json({ message: 'El monto no puede ser negativo' });
    }
    await row.update({
      nombre,
      referencia:
        req.body?.referencia !== undefined
          ? String(req.body.referencia).trim() || null
          : row.referencia,
      monto,
      estado: req.body?.estado !== undefined ? String(req.body.estado).trim() || row.estado : row.estado,
      detalle: req.body?.detalle !== undefined ? String(req.body.detalle).trim() || null : row.detalle,
    });
    return res.status(200).json(toDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function eliminar(req, res) {
  try {
    const row = await Registro.findByPk(req.params.id);
    if (!row || !row.activo) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    await row.update({ activo: false, estado: 'inactivo' });
    return res.status(200).json({ message: 'Registro desactivado' });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
