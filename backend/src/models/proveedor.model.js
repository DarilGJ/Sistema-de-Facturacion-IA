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
    tipo_identificacion: {
      type: DataTypes.ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero'),
      allowNull: false,
      defaultValue: 'nit',
    },
    tipo_persona: {
      type: DataTypes.ENUM('juridico', 'individual'),
      allowNull: false,
      defaultValue: 'juridico',
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    razon_social: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    nit: {
      type: DataTypes.STRING(30),
      allowNull: true,
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
    telefono2: {
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
    email2: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: { msg: 'El correo #2 no es válido' },
      },
    },
    email3: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        isEmail: { msg: 'El correo #3 no es válido' },
      },
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pais: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    metodo_cancelacion: {
      type: DataTypes.ENUM('contado', 'credito'),
      allowNull: false,
      defaultValue: 'contado',
    },
    plazo_unidad: {
      type: DataTypes.ENUM('dias', 'meses', 'anio'),
      allowNull: false,
      defaultValue: 'dias',
    },
    plazo: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    tiempo_entrega_dias: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
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
