import { Producto, Proveedor } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const includeProveedor = {
  model: Proveedor,
  as: 'proveedor',
  attributes: ['id', 'nombre_comercial', 'tiempo_entrega_dias', 'estado'],
};

function text(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
}

function money(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function intVal(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function payloadFromBody(body, { partial = false } = {}) {
  const tipo = body.tipo === 'servicio' ? 'servicio' : body.tipo === 'producto' ? 'producto' : undefined;
  const data = {
    sku: text(body.sku),
    nombre: text(body.nombre),
    tipo,
    detalle: text(body.detalle),
    ubicacion: text(body.ubicacion),
    unidad_medida: text(body.unidad_medida),
    categoria: text(body.categoria),
    subcategoria: text(body.subcategoria),
    marca: text(body.marca),
    impuesto_tipo: text(body.impuesto_tipo),
    impuesto_nombre: text(body.impuesto_nombre),
    impuesto_porcentaje: money(body.impuesto_porcentaje, partial ? undefined : 12),
    precio_venta: money(body.precio_venta, partial ? undefined : 0),
    precio_2: money(body.precio_2, partial ? undefined : 0),
    precio_3: money(body.precio_3, partial ? undefined : 0),
    costo_compra: money(body.costo_compra, partial ? undefined : 0),
    stock_actual: intVal(body.stock_actual, partial ? undefined : 0),
    stock_minimo: intVal(body.stock_minimo, partial ? undefined : 0),
    stock_reorden: intVal(body.stock_reorden, partial ? undefined : 0),
    stock_maximo: intVal(body.stock_maximo, partial ? undefined : 0),
    unidad_compra: text(body.unidad_compra),
    factor_conversion: money(body.factor_conversion, partial ? undefined : 1),
    es_padre_variantes:
      body.es_padre_variantes === undefined ? undefined : Boolean(body.es_padre_variantes),
    bodega: text(body.bodega),
    id_proveedor: body.id_proveedor === undefined ? undefined : body.id_proveedor || null,
    estado: body.estado === undefined ? undefined : Boolean(body.estado),
  };

  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export async function crear(req, res) {
  try {
    const data = payloadFromBody(req.body || {});

    if (!data.sku || !data.nombre || data.precio_venta === undefined || data.costo_compra === undefined) {
      return res.status(400).json({
        message: 'sku, nombre, precio_venta y costo_compra son requeridos',
      });
    }

    if (data.id_proveedor) {
      const proveedor = await Proveedor.findByPk(data.id_proveedor);
      if (!proveedor) {
        return res.status(400).json({ message: 'El proveedor indicado no existe' });
      }
    }

    const producto = await Producto.create({
      ...data,
      tipo: data.tipo || 'producto',
      unidad_medida: data.unidad_medida || 'unidad',
      impuesto_porcentaje: data.impuesto_porcentaje ?? 12,
      precio_2: data.precio_2 ?? 0,
      precio_3: data.precio_3 ?? 0,
      stock_actual: data.stock_actual ?? 0,
      stock_minimo: data.stock_minimo ?? 0,
      stock_reorden: data.stock_reorden ?? 0,
      stock_maximo: data.stock_maximo ?? 0,
      factor_conversion: data.factor_conversion ?? 1,
      es_padre_variantes: data.es_padre_variantes ?? false,
      estado: data.estado ?? true,
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

    const data = payloadFromBody(req.body || {}, { partial: true });

    if (data.id_proveedor) {
      const proveedor = await Proveedor.findByPk(data.id_proveedor);
      if (!proveedor) {
        return res.status(400).json({ message: 'El proveedor indicado no existe' });
      }
    }

    await producto.update(data);

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
