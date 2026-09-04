import { Compra } from '../models/compra.model';
import { Factura } from '../models/factura.model';

export function nombreProveedorCompra(compra: Compra): string {
  const p = compra.proveedor;
  if (!p) {
    return 'Proveedor';
  }
  return p.nombre_comercial || p.razon_social || p.nombre || 'Proveedor';
}

export function compraComoFactura(doc: Compra): Factura {
  const nombre = nombreProveedorCompra(doc);
  return {
    id: doc.id,
    numero: doc.numero,
    id_cliente: doc.id_proveedor,
    fecha: doc.fecha,
    metodo_pago: doc.metodo_pago,
    condicion_venta: doc.condicion_venta,
    tipo_factura: 'factura',
    moneda: doc.moneda || 'Quetzal',
    descuento: doc.descuento,
    subtotal: doc.subtotal,
    itbis: doc.iva,
    total: doc.total,
    estado: doc.estado === 'anulada' ? 'anulada' : doc.estado === 'pendiente' ? 'pendiente' : 'cancelada',
    notas: doc.notas,
    vendedor: doc.vendedor,
    cliente: {
      id: doc.proveedor?.id || doc.id_proveedor,
      nombre,
      nit: doc.proveedor?.nit || 'N/D',
      email: doc.proveedor?.email || null,
      telefono: doc.proveedor?.telefono || null,
      direccion: doc.proveedor?.direccion || null,
    },
    items: (doc.items || []).map((linea) => ({
      id: linea.id,
      id_factura: doc.id,
      id_producto: linea.id_producto,
      descripcion: linea.descripcion,
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      subtotal: linea.subtotal,
      producto: linea.producto,
    })),
  };
}
