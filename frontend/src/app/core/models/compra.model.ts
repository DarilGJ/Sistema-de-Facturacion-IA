export interface CompraItem {
  id: number;
  id_compra: number;
  id_producto: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number | string;
  descuento: number | string;
  subtotal: number | string;
  iva: number | string;
  total: number | string;
  producto?: { id: number; sku: string; nombre?: string; tipo?: string };
}

export interface Compra {
  id: number;
  numero: string;
  numero_proveedor: string | null;
  id_proveedor: number;
  id_bodega: number | null;
  fecha: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  condicion_venta: 'contado' | 'credito';
  moneda: string;
  vendedor: string | null;
  canal: string | null;
  requerimientos: string | null;
  plazo: number;
  plazo_unidad: 'dias' | 'meses' | 'anio';
  vencimiento: string | null;
  notas: string | null;
  descuento: number | string;
  subtotal: number | string;
  iva: number | string;
  total: number | string;
  archivado?: boolean;
  estado: 'pendiente' | 'cancelada' | 'anulada' | 'registrada';
  proveedor?: {
    id: number;
    nombre?: string | null;
    razon_social?: string | null;
    nombre_comercial?: string;
    nit?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  items?: CompraItem[];
}

export interface CompraPayload {
  id_proveedor: number;
  id_bodega?: number;
  numero_proveedor?: string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  condicion_venta: 'contado' | 'credito';
  moneda?: string;
  vendedor?: string;
  canal?: string;
  requerimientos?: string;
  plazo?: number;
  plazo_unidad?: 'dias' | 'meses' | 'anio';
  vencimiento?: string;
  notas?: string;
  fecha?: string;
  descuento?: number;
  items: Array<{ id_producto: number; cantidad: number; precio_unitario?: number; descuento?: number }>;
}

export interface CompraLinea {
  uid: number;
  id_producto: number;
  sku: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio: number;
  descuento: number;
}
