import { Cliente } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const TIPOS_IDENTIFICACION = ['nit', 'cui_dpi', 'consumidor_final', 'extranjero'];
const TIPOS_PERSONA = ['juridico', 'individual'];
const METODOS_CANCELACION = ['contado', 'credito'];
const PRECIOS_FACTURAR = ['precio_1', 'precio_2', 'precio_3'];
const PLAZOS_UNIDAD = ['dias', 'meses', 'anio'];

function normalizeEmail(email) {
  if (email === undefined || email === null || String(email).trim() === '') {
    return null;
  }
  return String(email).trim().toLowerCase();
}

function trimOrNull(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function buildPayload(body, { partial = false } = {}) {
  const src = body || {};
  const payload = {};

  const setIf = (key, present, value) => {
    if (!partial || present) {
      payload[key] = value;
    }
  };

  setIf(
    'tipo_identificacion',
    src.tipo_identificacion !== undefined,
    oneOf(src.tipo_identificacion, TIPOS_IDENTIFICACION, 'nit')
  );
  setIf(
    'tipo_persona',
    src.tipo_persona !== undefined,
    oneOf(src.tipo_persona, TIPOS_PERSONA, 'individual')
  );
  setIf('nombre', src.nombre !== undefined, src.nombre ? String(src.nombre).trim() : src.nombre);
  setIf('razon_social', src.razon_social !== undefined, trimOrNull(src.razon_social));
  setIf('nit', src.nit !== undefined, src.nit ? String(src.nit).trim() : src.nit);
  setIf('email', src.email !== undefined, normalizeEmail(src.email));
  setIf('telefono', src.telefono !== undefined, trimOrNull(src.telefono));
  setIf('direccion', src.direccion !== undefined, trimOrNull(src.direccion));
  setIf('pais', src.pais !== undefined, trimOrNull(src.pais));
  setIf('nombre_comercial', src.nombre_comercial !== undefined, trimOrNull(src.nombre_comercial));
  setIf('telefono2', src.telefono2 !== undefined, trimOrNull(src.telefono2));
  setIf('email2', src.email2 !== undefined, normalizeEmail(src.email2));
  setIf('email3', src.email3 !== undefined, normalizeEmail(src.email3));
  setIf('nota', src.nota !== undefined, trimOrNull(src.nota));
  setIf(
    'metodo_cancelacion',
    src.metodo_cancelacion !== undefined,
    oneOf(src.metodo_cancelacion, METODOS_CANCELACION, 'contado')
  );
  setIf(
    'plazo_unidad',
    src.plazo_unidad !== undefined,
    oneOf(src.plazo_unidad, PLAZOS_UNIDAD, 'dias')
  );
  setIf('plazo', src.plazo !== undefined, Math.max(0, Math.trunc(toNumber(src.plazo, 0))));
  setIf(
    'precio_facturar',
    src.precio_facturar !== undefined,
    oneOf(src.precio_facturar, PRECIOS_FACTURAR, 'precio_1')
  );
  setIf(
    'porcentaje_descuento',
    src.porcentaje_descuento !== undefined,
    toNumber(src.porcentaje_descuento, 0)
  );
  setIf('codigo', src.codigo !== undefined, trimOrNull(src.codigo));
  setIf(
    'id_vendedor',
    src.id_vendedor !== undefined,
    src.id_vendedor === null || src.id_vendedor === '' ? null : Number(src.id_vendedor) || null
  );
  setIf('zona', src.zona !== undefined, trimOrNull(src.zona));
  setIf('credito_maximo', src.credito_maximo !== undefined, toNumber(src.credito_maximo, 0));
  setIf('estado', src.estado !== undefined, src.estado === undefined ? true : Boolean(src.estado));

  if (payload.tipo_identificacion === 'consumidor_final') {
    payload.nit = payload.nit || 'CF';
    payload.nombre = payload.nombre || 'Consumidor Final';
    payload.tipo_persona = 'individual';
    payload.razon_social = null;
    payload.pais = null;
    if (!payload.direccion) {
      payload.direccion = 'Guatemala';
    }
  }

  if (payload.tipo_identificacion && payload.tipo_identificacion !== 'extranjero') {
    payload.pais = null;
  }

  if (payload.tipo_persona === 'individual') {
    payload.razon_social = null;
  }

  if (payload.metodo_cancelacion === 'contado') {
    payload.credito_maximo = 0;
    payload.plazo = 0;
    payload.plazo_unidad = 'dias';
  }

  return payload;
}

export async function crear(req, res) {
  try {
    const payload = buildPayload(req.body);

    if (!payload.nombre || !payload.nit) {
      return res.status(400).json({ message: 'nombre y número de identificación son requeridos' });
    }

    const cliente = await Cliente.create({
      ...payload,
      estado: payload.estado === undefined ? true : payload.estado,
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

    const payload = buildPayload(req.body, { partial: true });
    await cliente.update(payload);
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
