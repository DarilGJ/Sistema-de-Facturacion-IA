import { Op } from 'sequelize';
import { Categoria, Producto, sequelize } from '../models/index.js';
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
  const found = await Categoria.findOne({
    where: excludeId ? { nombre, id: { [Op.ne]: excludeId } } : { nombre },
  });
  return Boolean(found);
}

async function conteoProductos() {
  const rows = await Producto.findAll({
    attributes: ['categoria', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    group: ['categoria'],
    raw: true,
  });
  return new Map(
    rows
      .filter((row) => row.categoria)
      .map((row) => [String(row.categoria).toLowerCase(), Number(row.total)])
  );
}

function toDto(row, counts) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    estado: asBool(data.estado, true),
    productos: counts.get(String(data.nombre || '').toLowerCase()) || 0,
  };
}

export async function listar(_req, res) {
  try {
    const [categorias, counts] = await Promise.all([
      Categoria.findAll({ order: [['nombre', 'ASC']] }),
      conteoProductos(),
    ]);
    return res.status(200).json(categorias.map((row) => toDto(row, counts)));
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
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion: trimOrNull(req.body?.descripcion),
      estado: asBool(req.body?.estado, true),
    });
    const counts = await conteoProductos();
    return res.status(201).json(toDto(categoria, counts));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const data = {};
    if (req.body?.nombre !== undefined) {
      const nombre = trimOrNull(req.body.nombre);
      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
      }
      if (await nombreDuplicado(nombre, categoria.id)) {
        return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
      }
      data.nombre = nombre;
    }
    if (req.body?.descripcion !== undefined) {
      data.descripcion = trimOrNull(req.body.descripcion);
    }
    if (req.body?.estado !== undefined) {
      data.estado = asBool(req.body.estado, categoria.estado);
    }

    const nombreAnterior = categoria.nombre;
    await categoria.update(data);

    if (data.nombre && data.nombre !== nombreAnterior) {
      await Producto.update(
        { categoria: data.nombre },
        { where: { categoria: nombreAnterior } }
      );
    }

    const counts = await conteoProductos();
    return res.status(200).json(toDto(categoria, counts));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
