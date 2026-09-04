import { Cotizacion } from '../models/cotizacion.model';
import { Factura } from '../models/factura.model';

export function cotizacionComoFactura(doc: Cotizacion): Factura {
  return {
    id: doc.id,
    numero: doc.numero,
    id_cliente: doc.id_cliente,
    fecha: doc.fecha,
    metodo_pago: doc.metodo_pago === 'credito' ? 'transferencia' : 'efectivo',
    condicion_venta: doc.metodo_pago,
    tipo_factura: 'factura',
    moneda: 'Quetzal',
    descuento: 0,
    subtotal: doc.subtotal,
    itbis: doc.itbis,
    total: doc.total,
    estado: doc.estado === 'anulada' ? 'anulada' : doc.estado === 'pendiente' ? 'pendiente' : 'cancelada',
    cliente: doc.cliente,
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
