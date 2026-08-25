import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Producto = sequelize.define(
  'Producto',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El SKU es obligatorio' },
      },
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del producto es obligatorio' },
      },
    },
    categoria: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'El precio de venta debe ser numérico' },
        min: { args: [0], msg: 'El precio de venta no puede ser negativo' },
      },
    },
    costo_compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'El costo de compra debe ser numérico' },
        min: { args: [0], msg: 'El costo de compra no puede ser negativo' },
      },
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock actual no puede ser negativo' },
      },
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock mínimo no puede ser negativo' },
      },
    },
    id_proveedor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'productos',
  }
);
