import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Proveedor = sequelize.define(
  'Proveedor',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre_comercial: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre comercial es obligatorio' },
      },
    },
    contacto: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: { msg: 'El email del proveedor no es válido' },
      },
    },
    tiempo_entrega_dias: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: { msg: 'El tiempo de entrega debe ser un número entero' },
        min: { args: [0], msg: 'El tiempo de entrega no puede ser negativo' },
      },
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'proveedores',
  }
);
