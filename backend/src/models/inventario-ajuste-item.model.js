import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioAjusteItem = sequelize.define(
  'InventarioAjusteItem',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_ajuste: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_bodega: {
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
    tipo: {
      type: DataTypes.ENUM('mas', 'menos'),
      allowNull: false,
    },
    cantidad_ajuste: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    cantidad_final: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'inventario_ajuste_items',
  }
);
