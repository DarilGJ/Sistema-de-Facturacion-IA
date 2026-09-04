import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioTrasladoItem = sequelize.define(
  'InventarioTrasladoItem',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_traslado: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    cantidad_anterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad_traslado: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'inventario_traslado_items',
  }
);
