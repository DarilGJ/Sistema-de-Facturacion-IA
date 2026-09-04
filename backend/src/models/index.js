import { sequelize } from '../config/sequelize.js';
import { Proveedor } from './proveedor.model.js';
import { Cliente } from './cliente.model.js';
import { Producto } from './producto.model.js';
import { Factura } from './factura.model.js';
import { FacturaItem } from './factura-item.model.js';
import { Cotizacion } from './cotizacion.model.js';
import { CotizacionItem } from './cotizacion-item.model.js';
import { InventarioConfig } from './inventario-config.model.js';
import { Categoria } from './categoria.model.js';
import { Subcategoria } from './subcategoria.model.js';
import { Marca } from './marca.model.js';
import { Bodega } from './bodega.model.js';
import { BodegaProducto } from './bodega-producto.model.js';
import { InventarioAjuste } from './inventario-ajuste.model.js';
import { InventarioAjusteItem } from './inventario-ajuste-item.model.js';
import { InventarioTraslado } from './inventario-traslado.model.js';
import { InventarioTrasladoItem } from './inventario-traslado-item.model.js';
import { InventarioMovimiento } from './inventario-movimiento.model.js';
import { InventarioDevolucion } from './inventario-devolucion.model.js';
import { InventarioDevolucionItem } from './inventario-devolucion-item.model.js';

Proveedor.hasMany(Producto, {
  foreignKey: 'id_proveedor',
  as: 'productos',
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL',
});

Producto.belongsTo(Proveedor, {
  foreignKey: 'id_proveedor',
  as: 'proveedor',
});

Cliente.hasMany(Factura, {
  foreignKey: 'id_cliente',
  as: 'facturas',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

Factura.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente',
});

Factura.hasMany(FacturaItem, {
  foreignKey: 'id_factura',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

FacturaItem.belongsTo(Factura, {
  foreignKey: 'id_factura',
  as: 'factura',
});

Producto.hasMany(FacturaItem, {
  foreignKey: 'id_producto',
  as: 'factura_items',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

FacturaItem.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
});

Cliente.hasMany(Cotizacion, {
  foreignKey: 'id_cliente',
  as: 'cotizaciones',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

Cotizacion.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente',
});

Cotizacion.hasMany(CotizacionItem, {
  foreignKey: 'id_cotizacion',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

CotizacionItem.belongsTo(Cotizacion, {
  foreignKey: 'id_cotizacion',
  as: 'cotizacion',
});

Producto.hasMany(CotizacionItem, {
  foreignKey: 'id_producto',
  as: 'cotizacion_items',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

CotizacionItem.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
});

Categoria.hasMany(Subcategoria, {
  foreignKey: 'id_categoria',
  as: 'subcategorias',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

Subcategoria.belongsTo(Categoria, {
  foreignKey: 'id_categoria',
  as: 'categoria',
});

Bodega.hasMany(BodegaProducto, {
  foreignKey: 'id_bodega',
  as: 'productos',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

BodegaProducto.belongsTo(Bodega, {
  foreignKey: 'id_bodega',
  as: 'bodega',
});

Producto.hasMany(BodegaProducto, {
  foreignKey: 'id_producto',
  as: 'bodegas',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

BodegaProducto.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
});

InventarioAjuste.hasMany(InventarioAjusteItem, {
  foreignKey: 'id_ajuste',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

InventarioAjusteItem.belongsTo(InventarioAjuste, {
  foreignKey: 'id_ajuste',
  as: 'ajuste',
});

InventarioAjusteItem.belongsTo(Bodega, {
  foreignKey: 'id_bodega',
  as: 'bodega',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioAjusteItem.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioTraslado.belongsTo(Bodega, {
  foreignKey: 'id_bodega_origen',
  as: 'origen',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioTraslado.belongsTo(Bodega, {
  foreignKey: 'id_bodega_destino',
  as: 'destino',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioTraslado.hasMany(InventarioTrasladoItem, {
  foreignKey: 'id_traslado',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

InventarioTrasladoItem.belongsTo(InventarioTraslado, {
  foreignKey: 'id_traslado',
  as: 'traslado',
});

InventarioTrasladoItem.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucion.belongsTo(Factura, {
  foreignKey: 'id_factura',
  as: 'factura',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucion.belongsTo(Cliente, {
  foreignKey: 'id_cliente',
  as: 'cliente',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucion.belongsTo(Bodega, {
  foreignKey: 'id_bodega',
  as: 'bodega',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucion.hasMany(InventarioDevolucionItem, {
  foreignKey: 'id_devolucion',
  as: 'items',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});

InventarioDevolucionItem.belongsTo(InventarioDevolucion, {
  foreignKey: 'id_devolucion',
  as: 'devolucion',
});

InventarioDevolucionItem.belongsTo(FacturaItem, {
  foreignKey: 'id_factura_item',
  as: 'factura_item',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucionItem.belongsTo(Producto, {
  foreignKey: 'id_producto',
  as: 'producto',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

InventarioDevolucionItem.belongsTo(Producto, {
  foreignKey: 'id_producto_cambio',
  as: 'producto_cambio',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
});

export {
  sequelize,
  Proveedor,
  Cliente,
  Producto,
  Factura,
  FacturaItem,
  Cotizacion,
  CotizacionItem,
  InventarioConfig,
  Categoria,
  Subcategoria,
  Marca,
  Bodega,
  BodegaProducto,
  InventarioAjuste,
  InventarioAjusteItem,
  InventarioTraslado,
  InventarioTrasladoItem,
  InventarioMovimiento,
  InventarioDevolucion,
  InventarioDevolucionItem,
};
