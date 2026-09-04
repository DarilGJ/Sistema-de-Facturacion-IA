import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const BodegaProducto = sequelize.define(
  'BodegaProducto',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_bodega: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'bodega_productos',
    indexes: [
      {
        unique: true,
        fields: ['id_bodega', 'id_producto'],
        name: 'uq_bodega_productos',
      },
    ],
  }
);
