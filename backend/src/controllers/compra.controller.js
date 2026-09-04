import {
  Bodega,
  BodegaProducto,
  Compra,
  CompraItem,
  Producto,
  Proveedor,
  sequelize,
} from '../models/index.js';
import { handleSequelizeError } from '../utils/http-error.js';
import { registrarKardex } from '../utils/kardex.js';
import { recalcStock } from '../utils/recalc-stock.js';

const IVA_RATE = 0.12;

function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function nextNumero(lastId) {
  return `COM-${String((lastId || 0) + 1).padStart(6, '0')}`;
}

const includeCompra = [
  {
    model: Proveedor,
    as: 'proveedor',
    attributes: ['id', 'nombre', 'razon_social', 'nombre_comercial', 'nit', 'email', 'telefono', 'direccion'],
  },
  {
    model: CompraItem,
    as: 'items',
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'sku', 'nombre', 'tipo'] }],
  },
];

export async function listar(_req, res) {
  try {
    const rows = await Compra.findAll({ include: includeCompra, order: [['id', 'DESC']] });
    return res.status(200).json(rows);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function obtenerPorId(req, res) {
  try {
    const row = await Compra.findByPk(req.params.id, { include: includeCompra });
    if (!row) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }
    return res.status(200).json(row);
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const {
      id_proveedor,
      id_bodega,
      numero_proveedor,
      metodo_pago,
      condicion_venta,
      moneda,
      vendedor,
      canal,
      requerimientos,
      plazo,
      plazo_unidad,
      vencimiento,
      notas,
      fecha,
      descuento: descuentoIn,
      items,
    } = req.body || {};

    if (!id_proveedor) {
      await t.rollback();
      return res.status(400).json({ message: 'Selecciona un proveedor' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Agrega al menos un producto a la compra' });
    }

    const proveedor = await Proveedor.findByPk(id_proveedor, { transaction: t });
    if (!proveedor || !proveedor.estado) {
      await t.rollback();
      return res.status(400).json({ message: 'El proveedor indicado no existe o está inactivo' });
    }

    const metodos = ['efectivo', 'tarjeta', 'transferencia'];
    const pago = metodos.includes(metodo_pago) ? metodo_pago : 'efectivo';
    const condicion = condicion_venta === 'credito' ? 'credito' : 'contado';
    const unidades = ['dias', 'meses', 'anio'];
    const unidad = unidades.includes(plazo_unidad) ? plazo_unidad : 'dias';

    let bodega = null;
    if (id_bodega) {
      bodega = await Bodega.findByPk(id_bodega, { transaction: t });
    }
    if (!bodega) {
      bodega = await Bodega.findOne({ where: { principal: true, estado: true }, transaction: t });
    }

    const lineas = [];
    let subtotal = 0;
    let ivaTotal = 0;
    let descLineas = 0;

    for (const item of items) {
      const cantidad = Number(item.cantidad);
      if (!item.id_producto || !Number.isInteger(cantidad) || cantidad < 1) {
        await t.rollback();
        return res.status(400).json({ message: 'Cada línea debe tener producto y cantidad válida' });
      }
      const producto = await Producto.findByPk(item.id_producto, { transaction: t, lock: t.LOCK.UPDATE });
      if (!producto || !producto.estado) {
        await t.rollback();
        return res.status(400).json({ message: 'Uno de los productos no existe o está inactivo' });
      }
      const precio = roundMoney(Number(item.precio_unitario ?? producto.costo_compra) || 0);
      const desc = roundMoney(Math.max(0, Number(item.descuento) || 0));
      const bruto = roundMoney(precio * cantidad);
      const gravable = roundMoney(Math.max(0, bruto - desc));
      const iva = roundMoney(gravable * IVA_RATE);
      const totalLinea = roundMoney(gravable + iva);
      subtotal = roundMoney(subtotal + bruto);
      descLineas = roundMoney(descLineas + desc);
      ivaTotal = roundMoney(ivaTotal + iva);
      lineas.push({ producto, cantidad, precio, desc, gravable, iva, totalLinea });
    }

    const descuentoExtra = roundMoney(Math.max(0, Number(descuentoIn) || 0));
    const descuento = roundMoney(descLineas + descuentoExtra);
    const gravableDoc = roundMoney(Math.max(0, subtotal - descuento));
    const iva = roundMoney(gravableDoc * IVA_RATE);
    const total = roundMoney(gravableDoc + iva);

    const ultima = await Compra.findOne({ order: [['id', 'DESC']], transaction: t, lock: t.LOCK.UPDATE });
    const fechaEmision = fecha ? new Date(fecha) : null;

    const compra = await Compra.create(
      {
        numero: nextNumero(ultima?.id),
        numero_proveedor: String(numero_proveedor || '').trim() || null,
        id_proveedor,
        id_bodega: bodega?.id || null,
        ...(fechaEmision && !Number.isNaN(fechaEmision.getTime()) ? { fecha: fechaEmision } : {}),
        metodo_pago: pago,
        condicion_venta: condicion,
        moneda: String(moneda || 'Quetzal').trim() || 'Quetzal',
        vendedor: String(vendedor || req.user?.nombre || '').trim() || null,
        canal: String(canal || '').trim() || null,
        requerimientos: String(requerimientos || '').trim() || null,
        plazo: Math.max(0, Number(plazo) || 0),
        plazo_unidad: unidad,
        vencimiento: vencimiento || null,
        notas: notas ? String(notas).trim() : null,
        descuento,
        subtotal: gravableDoc,
        iva,
        total,
        archivado: false,
        estado: condicion === 'credito' ? 'pendiente' : 'cancelada',
      },
      { transaction: t }
    );

    for (const linea of lineas) {
      await CompraItem.create(
        {
          id_compra: compra.id,
          id_producto: linea.producto.id,
          descripcion: linea.producto.nombre,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio,
          descuento: linea.desc,
          subtotal: linea.gravable,
          iva: linea.iva,
          total: linea.totalLinea,
        },
        { transaction: t }
      );

      const esServicio =
        linea.producto.tipo === 'servicio' ||
        String(linea.producto.categoria || '').toLowerCase().includes('servicio');
      if (esServicio) {
        continue;
      }

      let stock = null;
      if (bodega) {
        stock = await BodegaProducto.findOne({
          where: { id_bodega: bodega.id, id_producto: linea.producto.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!stock) {
          stock = await BodegaProducto.create(
            { id_bodega: bodega.id, id_producto: linea.producto.id, cantidad: 0 },
            { transaction: t }
          );
        }
        stock.cantidad = Number(stock.cantidad) + linea.cantidad;
        await stock.save({ transaction: t });
        await recalcStock([linea.producto.id], t);
      } else {
        await linea.producto.update(
          { stock_actual: Number(linea.producto.stock_actual) + linea.cantidad },
          { transaction: t, validate: false }
        );
      }

      await registrarKardex(
        [
          {
            modulo: 'compras',
            proceso: 'entrada_compra',
            documento_origen: 'compra',
            documento: compra.numero,
            id_producto: linea.producto.id,
            sku: linea.producto.sku,
            producto: linea.producto.nombre,
            cantidad: linea.cantidad,
            id_bodega: bodega?.id || null,
            bodega: bodega?.nombre || '',
            usuario: String(req.user?.nombre || req.user?.email || '').trim(),
          },
        ],
        t
      );
    }

    await t.commit();
    const creada = await Compra.findByPk(compra.id, { include: includeCompra });
    return res.status(201).json(creada);
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  const t = await sequelize.transaction();
  try {
    const row = await Compra.findByPk(req.params.id, {
      include: includeCompra,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    const { archivado, estado } = req.body || {};
    const patch = {};
    if (typeof archivado === 'boolean') {
      patch.archivado = archivado;
    }

    if (estado) {
      if (!['pendiente', 'cancelada', 'anulada'].includes(estado)) {
        await t.rollback();
        return res.status(400).json({ message: 'Estado inválido' });
      }
      if (estado === 'anulada' && row.estado !== 'anulada') {
        await revertirInventario(row, req.user, t);
      }
      patch.estado = estado;
    }

    await row.update(patch, { transaction: t });
    await t.commit();
    const actualizada = await Compra.findByPk(row.id, { include: includeCompra });
    return res.status(200).json(actualizada);
  } catch (error) {
    await t.rollback();
    return handleSequelizeError(error, res);
  }
}

async function revertirInventario(compra, user, t) {
  const bodega = compra.id_bodega ? await Bodega.findByPk(compra.id_bodega, { transaction: t }) : null;
  for (const linea of compra.items || []) {
    const producto = linea.producto || (await Producto.findByPk(linea.id_producto, { transaction: t }));
    if (!producto) {
      continue;
    }
    const esServicio =
      producto.tipo === 'servicio' || String(producto.categoria || '').toLowerCase().includes('servicio');
    if (esServicio) {
      continue;
    }
    const cantidad = Number(linea.cantidad) || 0;
    if (bodega) {
      const stock = await BodegaProducto.findOne({
        where: { id_bodega: bodega.id, id_producto: producto.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (stock) {
        stock.cantidad = Math.max(0, Number(stock.cantidad) - cantidad);
        await stock.save({ transaction: t });
        await recalcStock([producto.id], t);
      }
    } else {
      await producto.update(
        { stock_actual: Math.max(0, Number(producto.stock_actual) - cantidad) },
        { transaction: t, validate: false }
      );
    }
    await registrarKardex(
      [
        {
          modulo: 'compras',
          proceso: 'anular_compra',
          documento_origen: 'compra',
          documento: compra.numero,
          id_producto: producto.id,
          sku: producto.sku,
          producto: producto.nombre,
          cantidad: -cantidad,
          id_bodega: bodega?.id || null,
          bodega: bodega?.nombre || '',
          usuario: String(user?.nombre || user?.email || '').trim(),
        },
      ],
      t
    );
  }
}
