import { Op } from 'sequelize';
import { Bodega, Producto } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const TIPOS = ['venta', 'materia_prima'];

function trimOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  return String(value).trim();
}

function asBool(value, fallback = true) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return value === true || value === 1 || value === '1';
}

function asTipo(value, fallback = 'venta') {
  return TIPOS.includes(value) ? value : fallback;
}

async function nombreDuplicado(nombre, excludeId) {
  const found = await Bodega.findOne({
    where: excludeId ? { nombre, id: { [Op.ne]: excludeId } } : { nombre },
  });
  return Boolean(found);
}

async function marcarPrincipal(id) {
  await Bodega.update({ principal: false }, { where: { principal: true } });
  await Bodega.update({ principal: true }, { where: { id } });
}

async function asegurarPrincipal() {
  const actual = await Bodega.findOne({ where: { principal: true, estado: true } });
  if (actual) {
    return;
  }
  const siguiente = await Bodega.findOne({
    where: { estado: true },
    order: [['id', 'ASC']],
  });
  if (siguiente) {
    await siguiente.update({ principal: true });
  }
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    nombre: data.nombre,
    ubicacion: data.ubicacion || '',
    tipo: asTipo(data.tipo),
    estado: asBool(data.estado, true),
    principal: asBool(data.principal, false),
  };
}

export async function listar(_req, res) {
  try {
    const rows = await Bodega.findAll({
      order: [
        ['principal', 'DESC'],
        ['nombre', 'ASC'],
      ],
    });
    return res.status(200).json(rows.map(toDto));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  try {
    const nombre = trimOrNull(req.body?.nombre);
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    if (await nombreDuplicado(nombre)) {
      return res.status(400).json({ message: 'Ya existe una bodega con ese nombre' });
    }

    const total = await Bodega.count();
    const bodega = await Bodega.create({
      nombre,
      ubicacion: trimOrNull(req.body?.ubicacion),
      tipo: asTipo(req.body?.tipo),
      estado: asBool(req.body?.estado, true),
      principal: total === 0,
    });
    return res.status(201).json(toDto(bodega));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const bodega = await Bodega.findByPk(req.params.id);
    if (!bodega) {
      return res.status(404).json({ message: 'Bodega no encontrada' });
    }

    const data = {};
    if (req.body?.nombre !== undefined) {
      const nombre = trimOrNull(req.body.nombre);
      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
      }
      if (await nombreDuplicado(nombre, bodega.id)) {
        return res.status(400).json({ message: 'Ya existe una bodega con ese nombre' });
      }
      data.nombre = nombre;
    }
    if (req.body?.ubicacion !== undefined) {
      data.ubicacion = trimOrNull(req.body.ubicacion);
    }
    if (req.body?.tipo !== undefined) {
      data.tipo = asTipo(req.body.tipo, bodega.tipo);
    }
    if (req.body?.estado !== undefined) {
      data.estado = asBool(req.body.estado, bodega.estado);
    }

    const nombreAnterior = bodega.nombre;
    await bodega.update(data);

    if (req.body?.principal === true) {
      await marcarPrincipal(bodega.id);
    }

    await asegurarPrincipal();

    if (data.nombre && data.nombre !== nombreAnterior) {
      await Producto.update({ bodega: data.nombre }, { where: { bodega: nombreAnterior } });
    }

    const actualizada = await Bodega.findByPk(bodega.id);
    return res.status(200).json(toDto(actualizada));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
