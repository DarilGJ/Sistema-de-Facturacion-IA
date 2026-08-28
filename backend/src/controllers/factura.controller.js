import { Cliente, Factura, FacturaItem, Producto, sequelize } from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';

const ITBIS_RATE = 0.18;

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

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nextNumero(lastId) {
  return `FAC-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

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

    if (!id_cliente) {
      await t.rollback();
      return res.status(400).json({ message: 'El cliente es requerido' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto a la factura' });
    }

    const metodos = ['efectivo', 'tarjeta', 'transferencia'];
    const pago = metodos.includes(metodo_pago) ? metodo_pago : 'efectivo';

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

      const producto = await Producto.findByPk(item.id_producto, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!producto || !producto.estado) {
        await t.rollback();
        return res.status(400).json({ message: 'Uno de los productos no existe o está inactivo' });
      }

      if (producto.stock_actual < cantidad) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}`,
        });
      }

      const precio = roundMoney(producto.precio_venta);
      const lineaSubtotal = roundMoney(precio * cantidad);
      subtotal = roundMoney(subtotal + lineaSubtotal);

      lineas.push({
        producto,
        cantidad,
        precio,
        lineaSubtotal,
      });
    }

    const itbis = roundMoney(subtotal * ITBIS_RATE);
    const total = roundMoney(subtotal + itbis);

    const ultima = await Factura.findOne({
      order: [['id', 'DESC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const factura = await Factura.create(
      {
        numero: nextNumero(ultima?.id),
        id_cliente,
        metodo_pago: pago,
        subtotal,
        itbis,
        total,
        estado: 'emitida',
      },
      { transaction: t }
    );

    for (const linea of lineas) {
      await FacturaItem.create(
        {
          id_factura: factura.id,
          id_producto: linea.producto.id,
          descripcion: linea.producto.nombre,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio,
          subtotal: linea.lineaSubtotal,
        },
        { transaction: t }
      );

      await linea.producto.update(
        { stock_actual: linea.producto.stock_actual - linea.cantidad },
        { transaction: t }
      );
    }

    await t.commit();

    const creada = await Factura.findByPk(factura.id, { include: includeFactura });
    return res.status(201).json(creada);
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}
