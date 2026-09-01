import { sequelize } from '../config/sequelize.js';
import { Proveedor } from './proveedor.model.js';
import { Cliente } from './cliente.model.js';
import { Producto } from './producto.model.js';
import { Factura } from './factura.model.js';
import { FacturaItem } from './factura-item.model.js';
import { Cotizacion } from './cotizacion.model.js';
import { CotizacionItem } from './cotizacion-item.model.js';

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

export { sequelize, Proveedor, Cliente, Producto, Factura, FacturaItem, Cotizacion, CotizacionItem };
