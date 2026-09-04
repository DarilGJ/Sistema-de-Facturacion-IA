import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioAjuste = sequelize.define(
  'InventarioAjuste',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    contabilizado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'inventario_ajustes',
  }
);
