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

export type TipoIdentificacion = 'nit' | 'cui_dpi' | 'consumidor_final' | 'extranjero';
export type TipoPersona = 'juridico' | 'individual';
export type MetodoCancelacion = 'contado' | 'credito';
export type PrecioFacturar = 'precio_1' | 'precio_2' | 'precio_3';
export type PlazoUnidad = 'dias' | 'meses' | 'anio';

export interface Proveedor {
  id: number;
  tipo_identificacion?: TipoIdentificacion;
  tipo_persona?: TipoPersona;
  nombre?: string | null;
  razon_social?: string | null;
  nit?: string | null;
  nombre_comercial: string;
  contacto: string | null;
  telefono: string | null;
  telefono2?: string | null;
  email: string | null;
  email2?: string | null;
  email3?: string | null;
  direccion?: string | null;
  pais?: string | null;
  metodo_cancelacion?: MetodoCancelacion;
  plazo_unidad?: PlazoUnidad;
  plazo?: number;
  tiempo_entrega_dias: number;
  estado: boolean;
}

export interface VendedorOpcion {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface Cliente {
  id: number;
  tipo_identificacion: TipoIdentificacion;
  tipo_persona: TipoPersona;
  nombre: string;
  razon_social: string | null;
  nit: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  pais: string | null;
  nombre_comercial: string | null;
  telefono2: string | null;
  email2: string | null;
  email3: string | null;
  nota: string | null;
  metodo_cancelacion: MetodoCancelacion;
  plazo_unidad: PlazoUnidad;
  plazo: number;
  precio_facturar: PrecioFacturar;
  porcentaje_descuento: number | string;
  codigo: string | null;
  id_vendedor: number | null;
  zona: string | null;
  credito_maximo: number | string;
  estado: boolean;
}

export type TipoArticulo = 'producto' | 'servicio';

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  tipo?: TipoArticulo;
  detalle?: string | null;
  ubicacion?: string | null;
  unidad_medida?: string | null;
  categoria: string | null;
  subcategoria?: string | null;
  marca?: string | null;
  impuesto_tipo?: string | null;
  impuesto_nombre?: string | null;
  impuesto_porcentaje?: number | string;
  precio_venta: number | string;
  precio_2?: number | string;
  precio_3?: number | string;
  costo_compra: number | string;
  stock_actual: number;
  stock_minimo: number;
  stock_reorden?: number;
  stock_maximo?: number;
  unidad_compra?: string | null;
  factor_conversion?: number | string;
  es_padre_variantes?: boolean;
  bodega?: string | null;
  id_proveedor: number | null;
  estado: boolean;
  proveedor?: Pick<Proveedor, 'id' | 'nombre_comercial' | 'tiempo_entrega_dias' | 'estado'> | null;
}

export interface ProveedorPayload {
  tipo_identificacion: TipoIdentificacion;
  tipo_persona: TipoPersona;
  nombre: string;
  nit: string;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  pais?: string | null;
  nombre_comercial?: string | null;
  telefono2?: string | null;
  email2?: string | null;
  email3?: string | null;
  metodo_cancelacion: MetodoCancelacion;
  plazo_unidad?: PlazoUnidad;
  plazo?: number;
  tiempo_entrega_dias?: number;
  estado?: boolean;
}

export interface ClientePayload {
  tipo_identificacion: TipoIdentificacion;
  tipo_persona: TipoPersona;
  nombre: string;
  nit: string;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  pais?: string | null;
  nombre_comercial?: string | null;
  telefono2?: string | null;
  email2?: string | null;
  email3?: string | null;
  nota?: string | null;
  metodo_cancelacion: MetodoCancelacion;
  plazo_unidad?: PlazoUnidad;
  plazo?: number;
  precio_facturar: PrecioFacturar;
  porcentaje_descuento?: number;
  codigo?: string | null;
  id_vendedor?: number | null;
  zona?: string | null;
  credito_maximo?: number;
  estado?: boolean;
}

export interface ProductoPayload {
  sku: string;
  nombre: string;
  tipo?: TipoArticulo;
  detalle?: string | null;
  ubicacion?: string | null;
  unidad_medida?: string | null;
  categoria?: string | null;
  subcategoria?: string | null;
  marca?: string | null;
  impuesto_tipo?: string | null;
  impuesto_nombre?: string | null;
  impuesto_porcentaje?: number;
  precio_venta: number;
  precio_2?: number;
  precio_3?: number;
  costo_compra: number;
  stock_actual?: number;
  stock_minimo?: number;
  stock_reorden?: number;
  stock_maximo?: number;
  unidad_compra?: string | null;
  factor_conversion?: number;
  es_padre_variantes?: boolean;
  bodega?: string | null;
  id_proveedor?: number | null;
  estado?: boolean;
}
