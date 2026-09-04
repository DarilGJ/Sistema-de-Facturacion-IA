export interface FacturaItem {
  id: number;
  id_factura: number;
  id_producto: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
  producto?: {
    id: number;
    sku: string;
    tipo?: string;
    nombre?: string;
  };
}

export type FacturaEstado = 'emitida' | 'anulada' | 'pendiente' | 'cancelada';
export type CondicionVenta = 'contado' | 'credito';
export type TipoFactura = 'factura' | 'factura_especial' | 'factura_cambiaria' | 'recibo';
export type Tributacion = 'no_entregado' | 'aceptadas' | 'rechazadas' | 'desconocido';
export type CorreoEstado = 'no_entregado' | 'enviado';

export interface FacturaCliente {
  id: number;
  nombre: string;
  razon_social?: string | null;
  nit: string;
  email: string | null;
  telefono: string | null;
  direccion?: string | null;
  nombre_comercial?: string | null;
}

export interface Factura {
  id: number;
  numero: string;
  id_cliente: number;
  fecha: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  condicion_venta?: CondicionVenta;
  tipo_factura?: TipoFactura;
  tributacion?: Tributacion;
  archivado?: boolean;
  correo_estado?: CorreoEstado;
  vendedor?: string | null;
  moneda?: string;
  descuento?: number | string;
  autorizacion?: string | null;
  serie?: string | null;
  numero_dte?: string | null;
  notas?: string | null;
  subtotal: number | string;
  itbis: number | string;
  total: number | string;
  estado: FacturaEstado;
  cliente?: FacturaCliente;
  items?: FacturaItem[];
}

export interface FacturaPayload {
  id_cliente: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  condicion_venta?: CondicionVenta;
  tipo_factura?: TipoFactura;
  vendedor?: string;
  moneda?: string;
  descuento?: number;
  notas?: string;
  items: Array<{ id_producto: number; cantidad: number; precio_unitario?: number }>;
}

export interface FacturaPatch {
  archivado?: boolean;
  correo_estado?: CorreoEstado;
  tributacion?: Tributacion;
  estado?: 'anulada';
}

export interface CarritoLinea {
  uid?: number;
  id_producto: number;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  cantidad: number;
}
