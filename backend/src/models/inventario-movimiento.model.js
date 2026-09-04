import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioMovimiento = sequelize.define(
  'InventarioMovimiento',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    modulo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    proceso: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    documento_origen: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    documento: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    id_producto: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: '',
    },
    producto: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_bodega: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    bodega: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: '',
    },
    usuario: {
      type: DataTypes.STRING(160),
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'inventario_movimientos',
    indexes: [
      { fields: ['fecha'] },
      { fields: ['proceso'] },
      { fields: ['documento_origen'] },
      { fields: ['documento'] },
    ],
  }
);
