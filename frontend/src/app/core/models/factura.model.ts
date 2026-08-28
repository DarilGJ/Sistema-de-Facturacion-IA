export interface FacturaItem {
  id: number;
  id_factura: number;
  id_producto: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

export interface Factura {
  id: number;
  numero: string;
  id_cliente: number;
  fecha: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  subtotal: number | string;
  itbis: number | string;
  total: number | string;
  estado: 'emitida' | 'anulada';
  cliente?: {
    id: number;
    nombre: string;
    nit: string;
    email: string | null;
    telefono: string | null;
  };
  items?: FacturaItem[];
}

export interface FacturaPayload {
  id_cliente: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  items: Array<{ id_producto: number; cantidad: number }>;
}

export interface CarritoLinea {
  id_producto: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  cantidad: number;
}
