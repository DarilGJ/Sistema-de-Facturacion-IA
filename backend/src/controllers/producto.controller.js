import { Producto, Proveedor } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const includeProveedor = {
  model: Proveedor,
  as: 'proveedor',
  attributes: ['id', 'nombre_comercial', 'tiempo_entrega_dias', 'estado'],
};

export async function crear(req, res) {
  try {
    const {
      sku,
      nombre,
      categoria,
      precio_venta,
      costo_compra,
      stock_actual,
      stock_minimo,
      id_proveedor,
      estado,
    } = req.body || {};

    if (!sku || !nombre || precio_venta === undefined || costo_compra === undefined) {
      return res.status(400).json({
        message: 'sku, nombre, precio_venta y costo_compra son requeridos',
      });
    }

    if (id_proveedor) {
      const proveedor = await Proveedor.findByPk(id_proveedor);
      if (!proveedor) {
        return res.status(400).json({ message: 'El proveedor indicado no existe' });
      }
    }

    const producto = await Producto.create({
      sku: String(sku).trim(),
      nombre: String(nombre).trim(),
      categoria: categoria?.trim() || null,
      precio_venta,
      costo_compra,
      stock_actual: stock_actual === undefined ? 0 : Number(stock_actual),
      stock_minimo: stock_minimo === undefined ? 0 : Number(stock_minimo),
      id_proveedor: id_proveedor || null,
      estado: estado === undefined ? true : Boolean(estado),
    });

    const creado = await Producto.findByPk(producto.id, { include: [includeProveedor] });
    return res.status(201).json(creado);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function listar(_req, res) {
  try {
    const productos = await Producto.findAll({
      include: [includeProveedor],
      order: [['id', 'ASC']],
    });
    return res.status(200).json(productos);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [includeProveedor],
    });

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.status(200).json(producto);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const {
      sku,
      nombre,
      categoria,
      precio_venta,
      costo_compra,
      stock_actual,
      stock_minimo,
      id_proveedor,
      estado,
    } = req.body || {};

    if (id_proveedor) {
      const proveedor = await Proveedor.findByPk(id_proveedor);
      if (!proveedor) {
        return res.status(400).json({ message: 'El proveedor indicado no existe' });
      }
    }

    await producto.update({
      ...(sku !== undefined && { sku: String(sku).trim() }),
      ...(nombre !== undefined && { nombre: String(nombre).trim() }),
      ...(categoria !== undefined && { categoria: categoria?.trim() || null }),
      ...(precio_venta !== undefined && { precio_venta }),
      ...(costo_compra !== undefined && { costo_compra }),
      ...(stock_actual !== undefined && { stock_actual: Number(stock_actual) }),
      ...(stock_minimo !== undefined && { stock_minimo: Number(stock_minimo) }),
      ...(id_proveedor !== undefined && { id_proveedor: id_proveedor || null }),
      ...(estado !== undefined && { estado: Boolean(estado) }),
    });

    const actualizado = await Producto.findByPk(producto.id, { include: [includeProveedor] });
    return res.status(200).json(actualizado);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function eliminarLogico(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await producto.update({ estado: false });
    return res.status(200).json({
      message: 'Producto desactivado',
      data: producto,
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
