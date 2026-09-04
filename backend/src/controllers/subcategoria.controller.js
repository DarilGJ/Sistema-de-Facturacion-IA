import { Op } from 'sequelize';
import { Categoria, Producto, Subcategoria } from '../models/index.js';
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

function asId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const includeCategoria = {
  model: Categoria,
  as: 'categoria',
  attributes: ['id', 'nombre', 'estado'],
};

async function nombreDuplicado(nombre, idCategoria, excludeId) {
  const where = { nombre, id_categoria: idCategoria };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  return Boolean(await Subcategoria.findOne({ where }));
}

function toDto(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    estado: asBool(data.estado, true),
    id_categoria: data.id_categoria,
    categoria: data.categoria?.nombre || '',
  };
}

export async function listar(_req, res) {
  try {
    const rows = await Subcategoria.findAll({
      include: [includeCategoria],
      order: [
        [{ model: Categoria, as: 'categoria' }, 'nombre', 'ASC'],
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
    const idCategoria = asId(req.body?.id_categoria);
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    if (!idCategoria) {
      return res.status(400).json({ message: 'La categoría es obligatoria' });
    }

    const categoria = await Categoria.findByPk(idCategoria);
    if (!categoria) {
      return res.status(400).json({ message: 'La categoría indicada no existe' });
    }
    if (await nombreDuplicado(nombre, idCategoria)) {
      return res.status(400).json({ message: 'Ya existe una subcategoría con ese nombre en la categoría' });
    }

    const creada = await Subcategoria.create({
      nombre,
      descripcion: trimOrNull(req.body?.descripcion),
      id_categoria: idCategoria,
      estado: asBool(req.body?.estado, true),
    });
    const completa = await Subcategoria.findByPk(creada.id, { include: [includeCategoria] });
    return res.status(201).json(toDto(completa));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const subcategoria = await Subcategoria.findByPk(req.params.id, { include: [includeCategoria] });
    if (!subcategoria) {
      return res.status(404).json({ message: 'Subcategoría no encontrada' });
    }

    const data = {};
    if (req.body?.nombre !== undefined) {
      const nombre = trimOrNull(req.body.nombre);
      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es obligatorio' });
      }
      data.nombre = nombre;
    }
    if (req.body?.descripcion !== undefined) {
      data.descripcion = trimOrNull(req.body.descripcion);
    }
    if (req.body?.id_categoria !== undefined) {
      const idCategoria = asId(req.body.id_categoria);
      if (!idCategoria) {
        return res.status(400).json({ message: 'La categoría es obligatoria' });
      }
      const categoria = await Categoria.findByPk(idCategoria);
      if (!categoria) {
        return res.status(400).json({ message: 'La categoría indicada no existe' });
      }
      data.id_categoria = idCategoria;
    }
    if (req.body?.estado !== undefined) {
      data.estado = asBool(req.body.estado, subcategoria.estado);
    }

    const nombreFinal = data.nombre ?? subcategoria.nombre;
    const categoriaFinal = data.id_categoria ?? subcategoria.id_categoria;
    if (await nombreDuplicado(nombreFinal, categoriaFinal, subcategoria.id)) {
      return res.status(400).json({ message: 'Ya existe una subcategoría con ese nombre en la categoría' });
    }

    const nombreAnterior = subcategoria.nombre;
    const categoriaAnterior = subcategoria.categoria?.nombre;

    await subcategoria.update(data);
    const actualizada = await Subcategoria.findByPk(subcategoria.id, { include: [includeCategoria] });
    const categoriaNueva = actualizada.categoria?.nombre;

    if (
      categoriaAnterior &&
      (nombreAnterior !== actualizada.nombre || categoriaAnterior !== categoriaNueva)
    ) {
      await Producto.update(
        { subcategoria: actualizada.nombre, categoria: categoriaNueva || categoriaAnterior },
        { where: { subcategoria: nombreAnterior, categoria: categoriaAnterior } }
      );
    }

    return res.status(200).json(toDto(actualizada));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
