import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioDevolucionItem = sequelize.define(
  'InventarioDevolucionItem',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_devolucion: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_factura_item: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    restablece_stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cantidad_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cantidad_final: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    id_producto_cambio: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    cantidad_cambio: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    precio_cambio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal_cambio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cantidad_anterior_cambio: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cantidad_final_cambio: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'inventario_devolucion_items',
  }
);
