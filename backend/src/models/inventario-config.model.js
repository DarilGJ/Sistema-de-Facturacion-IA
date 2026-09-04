import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioConfig = sequelize.define(
  'InventarioConfig',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      defaultValue: 1,
    },
    control_lotes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bloquear_ventas_sin_stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reserva_stock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    merma_ajustes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'inventario_config',
  }
);
