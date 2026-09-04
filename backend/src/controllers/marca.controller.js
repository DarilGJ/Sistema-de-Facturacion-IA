import { Op } from 'sequelize';
import { Marca, Producto } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

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

async function nombreDuplicado(nombre, excludeId) {
  const found = await Marca.findOne({
    where: excludeId ? { nombre, id: { [Op.ne]: excludeId } } : { nombre },
  });
  return Boolean(found);
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    estado: asBool(data.estado, true),
  };
}

export async function listar(_req, res) {
  try {
    const rows = await Marca.findAll({ order: [['nombre', 'ASC']] });
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
      return res.status(400).json({ message: 'Ya existe una marca con ese nombre' });
    }

    const marca = await Marca.create({
      nombre,
      descripcion: trimOrNull(req.body?.descripcion),
      estado: asBool(req.body?.estado, true),
    });
    return res.status(201).json(toDto(marca));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const marca = await Marca.findByPk(req.params.id);
    if (!marca) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    const data = {};
    if (req.body?.nombre !== undefined) {
      const nombre = trimOrNull(req.body.nombre);
      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
      }
      if (await nombreDuplicado(nombre, marca.id)) {
        return res.status(400).json({ message: 'Ya existe una marca con ese nombre' });
      }
      data.nombre = nombre;
    }
    if (req.body?.descripcion !== undefined) {
      data.descripcion = trimOrNull(req.body.descripcion);
    }
    if (req.body?.estado !== undefined) {
      data.estado = asBool(req.body.estado, marca.estado);
    }

    const nombreAnterior = marca.nombre;
    await marca.update(data);

    if (data.nombre && data.nombre !== nombreAnterior) {
      await Producto.update({ marca: data.nombre }, { where: { marca: nombreAnterior } });
    }

    return res.status(200).json(toDto(marca));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
