import { sequelize } from '../config/sequelize.js';
import { Proveedor } from './proveedor.model.js';
import { Cliente } from './cliente.model.js';
import { Producto } from './producto.model.js';

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

export { sequelize, Proveedor, Cliente, Producto };
