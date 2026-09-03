import { Cliente, Factura, FacturaItem, sequelize } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { emitirFactura } from '../services/emitir-factura.js';

const includeFactura = [
  {
    model: Cliente,
    as: 'cliente',
    attributes: ['id', 'nombre', 'nit', 'email', 'telefono'],
  },
  {
    model: FacturaItem,
    as: 'items',
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
    const { id_cliente, metodo_pago, items } = req.body || {};
    const factura = await emitirFactura({ id_cliente, metodo_pago, items, transaction: t });
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
