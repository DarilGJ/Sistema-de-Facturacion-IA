import { Cliente, Cotizacion, CotizacionItem, Factura, FacturaItem, Producto, sequelize } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { emitirFactura } from '../services/emitir-factura.js';

const ITBIS_RATE = 0.18;

const includeCotizacion = [
  {
    model: Cliente,
    as: 'cliente',
    attributes: ['id', 'nombre', 'nit', 'email', 'telefono'],
  },
  {
    model: CotizacionItem,
    as: 'items',
  },
];

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nextNumero(lastId) {
  return `COT-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

export async function listar(_req, res) {
  try {
    const rows = await Cotizacion.findAll({
      include: includeCotizacion,
      order: [['id', 'DESC']],
    });
    return res.status(200).json(rows);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const row = await Cotizacion.findByPk(req.params.id, { include: includeCotizacion });
    if (!row) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }
    return res.status(200).json(row);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();

  try {
    const { id_cliente, metodo_pago, items } = req.body || {};

    if (!id_cliente) {
      await t.rollback();
      return res.status(400).json({ message: 'El cliente es requerido' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto a la cotización' });
    }

    const metodos = ['contado', 'credito'];
    const pago = metodos.includes(metodo_pago) ? metodo_pago : 'contado';

    const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
    if (!cliente || !cliente.estado) {
      await t.rollback();
      return res.status(400).json({ message: 'El cliente indicado no existe o está inactivo' });
    }

    const lineas = [];
    let subtotal = 0;

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!item.id_producto || !Number.isInteger(cantidad) || cantidad < 1) {
        await t.rollback();
        return res.status(400).json({ message: 'Cada línea debe tener producto y cantidad válida' });
      }

      const producto = await Producto.findByPk(item.id_producto, { transaction: t });
      if (!producto || !producto.estado) {
        await t.rollback();
        return res.status(400).json({ message: 'Uno de los productos no existe o está inactivo' });
      }

      const precioOverride = Number(item.precio_unitario);
      const precio =
        Number.isFinite(precioOverride) && precioOverride >= 0
          ? roundMoney(precioOverride)
          : roundMoney(producto.precio_venta);
      const lineaSubtotal = roundMoney(precio * cantidad);
      subtotal = roundMoney(subtotal + lineaSubtotal);
      lineas.push({ producto, cantidad, precio, lineaSubtotal });
    }

    const itbis = roundMoney(subtotal * ITBIS_RATE);
    const total = roundMoney(subtotal + itbis);
    const ultima = await Cotizacion.findOne({
      order: [['id', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const cotizacion = await Cotizacion.create(
      {
        numero: nextNumero(ultima?.id),
        id_cliente,
        metodo_pago: pago,
        subtotal,
        itbis,
        total,
        estado: 'pendiente',
        generada: false,
      },
      { transaction: t }
    );

    for (const linea of lineas) {
      await CotizacionItem.create(
        {
          id_cotizacion: cotizacion.id,
          id_producto: linea.producto.id,
          descripcion: linea.producto.nombre,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio,
          subtotal: linea.lineaSubtotal,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const creada = await Cotizacion.findByPk(cotizacion.id, { include: includeCotizacion });
    return res.status(201).json(creada);
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}

export async function actualizarEstado(req, res) {
  try {
    const row = await Cotizacion.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const { estado, generada } = req.body || {};
    const estados = ['pendiente', 'cancelada', 'archivada'];
    if (estado && !estados.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await row.update({
      ...(estado ? { estado } : {}),
      ...(typeof generada === 'boolean' ? { generada } : {}),
    });

    const actualizada = await Cotizacion.findByPk(row.id, { include: includeCotizacion });
    return res.status(200).json(actualizada);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function convertirAFactura(req, res) {
  const t = await sequelize.transaction();

  try {
    const cotizacion = await Cotizacion.findByPk(req.params.id, {
      include: includeCotizacion,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!cotizacion) {
      await t.rollback();
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (cotizacion.generada) {
      await t.rollback();
      return res.status(400).json({ message: 'Esta cotización ya fue convertida a factura' });
    }

    if (cotizacion.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({ message: 'Solo se pueden facturar cotizaciones pendientes' });
    }

    const items = (cotizacion.items || []).map((linea) => ({
      id_producto: linea.id_producto,
      cantidad: Number(linea.cantidad),
      precio_unitario: Number(linea.precio_unitario),
    }));

    const metodo =
      cotizacion.metodo_pago === 'credito' ? 'transferencia' : 'efectivo';

    const factura = await emitirFactura({
      id_cliente: cotizacion.id_cliente,
      metodo_pago: metodo,
      items,
      transaction: t,
    });

    await cotizacion.update({ generada: true }, { transaction: t });
    await t.commit();

    const creada = await Factura.findByPk(factura.id, {
      include: [
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'nit', 'email', 'telefono'],
        },
        { model: FacturaItem, as: 'items' },
      ],
    });
    const actualizada = await Cotizacion.findByPk(cotizacion.id, { include: includeCotizacion });
    return res.status(201).json({ factura: creada, cotizacion: actualizada });
  } catch (error) {
    await t.rollback();
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    return handleSequelizeError(error, res);
  }
}
