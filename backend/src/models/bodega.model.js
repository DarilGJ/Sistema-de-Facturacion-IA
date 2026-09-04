import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Bodega = sequelize.define(
  'Bodega',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nombre de la bodega es obligatorio' },
      },
    },
    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('venta', 'materia_prima'),
      allowNull: false,
      defaultValue: 'venta',
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'bodegas',
  }
);
