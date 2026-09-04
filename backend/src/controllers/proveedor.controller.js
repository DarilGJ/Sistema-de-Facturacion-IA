import { Proveedor, Producto } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const TIPOS_IDENTIFICACION = ['nit', 'cui_dpi', 'consumidor_final', 'extranjero'];
const TIPOS_PERSONA = ['juridico', 'individual'];
const METODOS_CANCELACION = ['contado', 'credito'];
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
    oneOf(src.tipo_persona, TIPOS_PERSONA, 'juridico')
  );
  setIf('nombre', src.nombre !== undefined, trimOrNull(src.nombre));
  setIf('razon_social', src.razon_social !== undefined, trimOrNull(src.razon_social));
  setIf('nit', src.nit !== undefined, trimOrNull(src.nit));
  setIf('email', src.email !== undefined, normalizeEmail(src.email));
  setIf('telefono', src.telefono !== undefined, trimOrNull(src.telefono));
  setIf('direccion', src.direccion !== undefined, trimOrNull(src.direccion));
  setIf('pais', src.pais !== undefined, trimOrNull(src.pais));
  setIf('nombre_comercial', src.nombre_comercial !== undefined, trimOrNull(src.nombre_comercial));
  setIf('telefono2', src.telefono2 !== undefined, trimOrNull(src.telefono2));
  setIf('email2', src.email2 !== undefined, normalizeEmail(src.email2));
  setIf('email3', src.email3 !== undefined, normalizeEmail(src.email3));
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
    payload.plazo = 0;
    payload.plazo_unidad = 'dias';
  }

  const nombre = payload.nombre || payload.nombre_comercial;
  if (nombre) {
    payload.contacto = String(nombre).slice(0, 120);
    if (!payload.nombre_comercial) {
      payload.nombre_comercial = nombre;
    }
  }

  if (payload.plazo_unidad === 'dias' && payload.plazo) {
    payload.tiempo_entrega_dias = payload.plazo;
  } else if (payload.tiempo_entrega_dias === undefined && !partial) {
    payload.tiempo_entrega_dias = 1;
  }

  return payload;
}

export async function crear(req, res) {
  try {
    const payload = buildPayload(req.body);

    if (!payload.nombre && !payload.nombre_comercial) {
      return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
    }

    if (!payload.nit) {
      return res.status(400).json({ message: 'El número de identificación es requerido' });
    }

    const proveedor = await Proveedor.create({
      ...payload,
      nombre_comercial: payload.nombre_comercial || payload.nombre,
      tiempo_entrega_dias: payload.tiempo_entrega_dias ?? 1,
      estado: payload.estado === undefined ? true : payload.estado,
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

    const payload = buildPayload(req.body, { partial: true });
    await proveedor.update(payload);
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
