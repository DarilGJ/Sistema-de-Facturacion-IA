export interface CotizacionItem {
  id: number;
  id_cotizacion: number;
  id_producto: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number | string;
  subtotal: number | string;
}

export interface Cotizacion {
  id: number;
  numero: string;
  id_cliente: number;
  fecha: string;
  metodo_pago: 'contado' | 'credito';
  subtotal: number | string;
  itbis: number | string;
  total: number | string;
  estado: 'pendiente' | 'cancelada' | 'archivada';
  generada: boolean;
  cliente?: {
    id: number;
    nombre: string;
    nit: string;
    email: string | null;
    telefono: string | null;
  };
  items?: CotizacionItem[];
}

export interface CotizacionPayload {
  id_cliente: number;
  metodo_pago: 'contado' | 'credito';
  items: Array<{ id_producto: number; cantidad: number; precio_unitario?: number }>;
}
