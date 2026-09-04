import { Cliente, Factura, FacturaItem, Producto, sequelize } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { emitirFactura } from '../services/emitir-factura.js';

const includeFactura = [
  {
    model: Cliente,
    as: 'cliente',
    attributes: [
      'id',
      'nombre',
      'razon_social',
      'nit',
      'email',
      'telefono',
      'direccion',
      'nombre_comercial',
    ],
  },
  {
    model: FacturaItem,
    as: 'items',
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'sku', 'tipo', 'nombre'] }],
  },
];

export async function listar(_req, res) {
  try {
    const facturas = await Factura.findAll({
      include: includeFactura,
      order: [['id', 'DESC']],
    });
    return res.status(200).json(facturas);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const factura = await Factura.findByPk(req.params.id, { include: includeFactura });
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    return res.status(200).json(factura);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();

  try {
    const { id_cliente, metodo_pago, condicion_venta, tipo_factura, vendedor, moneda, descuento, notas, items } =
      req.body || {};
    const factura = await emitirFactura({
      id_cliente,
      metodo_pago,
      condicion_venta,
      tipo_factura,
      vendedor,
      moneda,
      descuento,
      notas,
      items,
      user: req.user,
      transaction: t,
    });
    await t.commit();
    const creada = await Factura.findByPk(factura.id, { include: includeFactura });
    return res.status(201).json(creada);
  } catch (error) {
    await t.rollback();
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    const body = req.body || {};
    if (body.archivado === true || body.archivado === false) {
      factura.archivado = body.archivado;
    }
    if (body.correo_estado === 'enviado' || body.correo_estado === 'no_entregado') {
      factura.correo_estado = body.correo_estado;
    }
    if (body.tributacion && ['no_entregado', 'aceptadas', 'rechazadas', 'desconocido'].includes(body.tributacion)) {
      factura.tributacion = body.tributacion;
    }
    if (body.estado === 'anulada') {
      if (factura.estado === 'anulada') {
        return res.status(400).json({ message: 'La factura ya está anulada' });
      }
      factura.estado = 'anulada';
    }

    await factura.save();
    const actualizada = await Factura.findByPk(factura.id, { include: includeFactura });
    return res.status(200).json(actualizada);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
