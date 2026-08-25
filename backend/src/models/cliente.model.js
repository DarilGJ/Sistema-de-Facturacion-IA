import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Cliente = sequelize.define(
  'Cliente',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del cliente es obligatorio' },
      },
    },
    nit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El NIT es obligatorio' },
      },
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: { msg: 'El email del cliente no es válido' },
      },
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'clientes',
  }
);
