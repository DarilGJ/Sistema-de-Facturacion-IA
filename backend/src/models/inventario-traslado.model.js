import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioTraslado = sequelize.define(
  'InventarioTraslado',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    id_bodega_origen: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_bodega_destino: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_usuario: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    realizado_por: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM('finalizado', 'anulado'),
      allowNull: false,
      defaultValue: 'finalizado',
    },
    tipo: {
      type: DataTypes.ENUM('interno', 'empresa'),
      allowNull: false,
      defaultValue: 'interno',
    },
  },
  {
    tableName: 'inventario_traslados',
  }
);
