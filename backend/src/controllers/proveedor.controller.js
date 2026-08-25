import { Proveedor, Producto } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

function normalizeEmail(email) {
  if (email === undefined || email === null || String(email).trim() === '') {
    return null;
  }
  return String(email).trim().toLowerCase();
}

export async function crear(req, res) {
  try {
    const { nombre_comercial, contacto, telefono, email, tiempo_entrega_dias, estado } =
      req.body || {};

    if (!nombre_comercial || tiempo_entrega_dias === undefined || tiempo_entrega_dias === '') {
      return res.status(400).json({
        message: 'nombre_comercial y tiempo_entrega_dias son requeridos',
      });
    }

    const proveedor = await Proveedor.create({
      nombre_comercial: String(nombre_comercial).trim(),
      contacto: contacto?.trim() || null,
      telefono: telefono?.trim() || null,
      email: normalizeEmail(email),
      tiempo_entrega_dias: Number(tiempo_entrega_dias),
      estado: estado === undefined ? true : Boolean(estado),
    });

    return res.status(201).json(proveedor);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function listar(_req, res) {
  try {
    const proveedores = await Proveedor.findAll({
      order: [['id', 'ASC']],
    });
    return res.status(200).json(proveedores);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id, {
      include: [{ model: Producto, as: 'productos' }],
    });

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    return res.status(200).json(proveedor);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    const { nombre_comercial, contacto, telefono, email, tiempo_entrega_dias, estado } =
      req.body || {};

    await proveedor.update({
      ...(nombre_comercial !== undefined && {
        nombre_comercial: String(nombre_comercial).trim(),
      }),
      ...(contacto !== undefined && { contacto: contacto?.trim() || null }),
      ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
      ...(email !== undefined && { email: normalizeEmail(email) }),
      ...(tiempo_entrega_dias !== undefined && {
        tiempo_entrega_dias: Number(tiempo_entrega_dias),
      }),
      ...(estado !== undefined && { estado: Boolean(estado) }),
    });

    return res.status(200).json(proveedor);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function eliminarLogico(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    await proveedor.update({ estado: false });
    return res.status(200).json({
      message: 'Proveedor desactivado',
      data: proveedor,
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
