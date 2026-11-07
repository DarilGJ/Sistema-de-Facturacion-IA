import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Registro = sequelize.define(
  'Registro',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    referencia: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'activo',
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: 'registros' }
);
