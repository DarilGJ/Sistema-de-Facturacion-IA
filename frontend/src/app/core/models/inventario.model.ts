export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  productos: number;
}

export type TipoBodega = 'venta' | 'materia_prima';

export interface Almacen {
  id: number;
  nombre: string;
  ubicacion: string;
  tipo: TipoBodega;
  estado: boolean;
  principal: boolean;
}

export interface BodegaPayload {
  nombre: string;
  ubicacion?: string | null;
  tipo?: TipoBodega;
  estado?: boolean;
  principal?: boolean;
}

export interface Existencia {
  id: number;
  id_bodega: number;
  id_producto: number;
  sku: string;
  nombre: string;
  cantidad: number;
}

export interface KardexMovimiento {
  id: number;
  fecha: string;
  modulo: string;
  proceso: string;
  documento_origen: string;
  documento: string;
  sku: string;
  producto: string;
  cantidad: number;
  bodega: string;
  usuario: string;
}

export interface KardexPage {
  rows: KardexMovimiento[];
  total: number;
  page: number;
  size: number;
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

export interface CategoriaPayload {
  nombre: string;
  descripcion?: string | null;
  estado?: boolean;
}

export interface Subcategoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  id_categoria: number;
  categoria: string;
}

export interface SubcategoriaPayload {
  nombre: string;
  descripcion?: string | null;
  estado?: boolean;
  id_categoria: number;
}

export interface Marca {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface MarcaPayload {
  nombre: string;
  descripcion?: string | null;
  estado?: boolean;
}

export type InventarioConfigKey =
  | 'control_lotes'
  | 'bloquear_ventas_sin_stock'
  | 'reserva_stock'
  | 'merma_ajustes';

export interface InventarioConfig {
  control_lotes: boolean;
  bloquear_ventas_sin_stock: boolean;
  reserva_stock: boolean;
  merma_ajustes: boolean;
}

export type TipoAjuste = 'mas' | 'menos';

export interface AjusteItem {
  id: number;
  id_bodega: number;
  id_producto: number;
  sku: string;
  producto: string;
  bodega: string;
  cantidad_anterior: number;
  tipo: TipoAjuste;
  cantidad_ajuste: number;
  cantidad_final: number;
}

export interface AjusteInventario {
  id: number;
  descripcion: string;
  id_usuario: number | null;
  realizado_por: string;
  fecha: string;
  contabilizado: boolean;
  items: AjusteItem[];
}

export interface AjusteItemPayload {
  id_bodega: number;
  id_producto: number;
  tipo: TipoAjuste;
  cantidad_ajuste: number;
}

export interface AjustePayload {
  descripcion?: string | null;
  items: AjusteItemPayload[];
}

export type EstadoTraslado = 'finalizado' | 'anulado';

export interface TrasladoItem {
  id: number;
  id_producto: number;
  sku: string;
  producto: string;
  cantidad_anterior: number;
  cantidad_traslado: number;
  precio_unitario: number;
  subtotal: number;
}

export interface TrasladoInventario {
  id: number;
  fecha: string;
  realizado_por: string;
  estado: EstadoTraslado;
  tipo: 'interno' | 'empresa';
  id_bodega_origen: number;
  id_bodega_destino: number;
  bodega_origen: string;
  bodega_destino: string;
  total_articulos: number;
  total_valor: number;
  items: TrasladoItem[];
}

export interface TrasladoPayload {
  id_bodega_origen: number;
  id_bodega_destino: number;
  items: Array<{ id_producto: number; cantidad_traslado: number }>;
}

export type RazonDevolucion = 'danado' | 'vencido' | 'no_gusto' | 'cambio_producto';
export type ResolucionDevolucion = 'reembolso_efectivo' | 'nota_credito' | 'cambio';

export interface DevolucionItem {
  id: number;
  id_factura_item: number;
  id_producto: number;
  sku: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  restablece_stock: boolean;
  cantidad_anterior: number;
  cantidad_final: number;
  id_producto_cambio: number | null;
  sku_cambio: string;
  producto_cambio: string;
  cantidad_cambio: number;
  precio_cambio: number;
  subtotal_cambio: number;
  cantidad_anterior_cambio: number | null;
  cantidad_final_cambio: number | null;
}

export interface DevolucionInventario {
  id: number;
  numero: string;
  referencia_nc: string;
  id_factura: number;
  factura: string;
  id_cliente: number;
  cliente: string;
  id_bodega: number;
  bodega: string;
  razon: RazonDevolucion;
  resolucion: ResolucionDevolucion;
  observacion: string;
  subtotal_devuelto: number;
  itbis_devuelto: number;
  total_devuelto: number;
  subtotal_cambio: number;
  itbis_cambio: number;
  total_cambio: number;
  diferencia: number;
  reembolso: number;
  cobro: number;
  nota_credito_monto: number;
  valor_inventario: number;
  contabilizado: boolean;
  realizado_por: string;
  fecha: string;
  items: DevolucionItem[];
}

export interface DevolucionFacturaItem {
  id_factura_item: number;
  id_producto: number;
  sku: string;
  producto: string;
  tipo?: string;
  cantidad_vendida: number;
  cantidad_devuelta: number;
  cantidad_disponible: number;
  precio_unitario: number;
  precio_venta: number;
}

export interface DevolucionFactura {
  id: number;
  numero: string;
  fecha: string;
  metodo_pago: string;
  id_cliente: number;
  cliente: string;
  items: DevolucionFacturaItem[];
}

export interface DevolucionPayload {
  id_factura: number;
  id_bodega: number;
  razon: RazonDevolucion;
  resolucion: ResolucionDevolucion;
  observacion?: string | null;
  items: Array<{
    id_factura_item: number;
    cantidad: number;
    id_producto_cambio?: number | null;
    cantidad_cambio?: number;
    precio_cambio?: number;
  }>;
}
