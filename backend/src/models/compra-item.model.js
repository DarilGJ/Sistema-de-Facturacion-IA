import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const CompraItem = sequelize.define(
  'CompraItem',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_compra: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    iva: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  { tableName: 'compra_items' }
);
