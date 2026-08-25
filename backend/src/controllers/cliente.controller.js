import { Cliente } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

function normalizeEmail(email) {
  if (email === undefined || email === null || String(email).trim() === '') {
    return null;
  }
  return String(email).trim().toLowerCase();
}

export async function crear(req, res) {
  try {
    const { nombre, nit, email, telefono, estado } = req.body || {};

    if (!nombre || !nit) {
      return res.status(400).json({ message: 'nombre y nit son requeridos' });
    }

    const cliente = await Cliente.create({
      nombre: String(nombre).trim(),
      nit: String(nit).trim(),
      email: normalizeEmail(email),
      telefono: telefono?.trim() || null,
      estado: estado === undefined ? true : Boolean(estado),
    });

    return res.status(201).json(cliente);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function listar(_req, res) {
  try {
    const clientes = await Cliente.findAll({
      order: [['id', 'ASC']],
    });
    return res.status(200).json(clientes);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const { nombre, nit, email, telefono, estado } = req.body || {};

    await cliente.update({
      ...(nombre !== undefined && { nombre: String(nombre).trim() }),
      ...(nit !== undefined && { nit: String(nit).trim() }),
      ...(email !== undefined && { email: normalizeEmail(email) }),
      ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
      ...(estado !== undefined && { estado: Boolean(estado) }),
    });

    return res.status(200).json(cliente);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function eliminarLogico(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    await cliente.update({ estado: false });
    return res.status(200).json({
      message: 'Cliente desactivado',
      data: cliente,
    });
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
