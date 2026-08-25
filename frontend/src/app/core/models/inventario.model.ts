export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  productos: number;
}

export interface Almacen {
  id: number;
  nombre: string;
  ubicacion: string;
  responsable: string;
  activo: boolean;
}

export interface Existencia {
  id: number;
  producto: string;
  sku: string;
  almacen: string;
  cantidad: number;
  minimo: number;
}

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  producto: string;
  almacen: string;
  cantidad: number;
  referencia: string;
}

export interface Proveedor {
  id: number;
  nombre_comercial: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  tiempo_entrega_dias: number;
  estado: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  nit: string;
  email: string | null;
  telefono: string | null;
  estado: boolean;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: string | null;
  precio_venta: number | string;
  costo_compra: number | string;
  stock_actual: number;
  stock_minimo: number;
  id_proveedor: number | null;
  estado: boolean;
  proveedor?: Pick<Proveedor, 'id' | 'nombre_comercial' | 'tiempo_entrega_dias' | 'estado'> | null;
}

export interface ProveedorPayload {
  nombre_comercial: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  tiempo_entrega_dias: number;
  estado?: boolean;
}

export interface ClientePayload {
  nombre: string;
  nit: string;
  email?: string | null;
  telefono?: string | null;
  estado?: boolean;
}

export interface ProductoPayload {
  sku: string;
  nombre: string;
  categoria?: string | null;
  precio_venta: number;
  costo_compra: number;
  stock_actual?: number;
  stock_minimo?: number;
  id_proveedor?: number | null;
  estado?: boolean;
}
