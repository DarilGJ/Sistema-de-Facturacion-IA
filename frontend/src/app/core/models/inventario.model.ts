export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  productos: number;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  unidad: string;
  activo: boolean;
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
  nombre: string;
  rnc: string;
  telefono: string;
  correo: string;
  activo: boolean;
}
