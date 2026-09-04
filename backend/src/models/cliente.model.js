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
    tipo_identificacion: {
      type: DataTypes.ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero'),
      allowNull: false,
      defaultValue: 'nit',
    },
    tipo_persona: {
      type: DataTypes.ENUM('juridico', 'individual'),
      allowNull: false,
      defaultValue: 'individual',
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del cliente es obligatorio' },
      },
    },
    razon_social: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    nit: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El número de identificación es obligatorio' },
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
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pais: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    nombre_comercial: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    telefono2: {
      type: DataTypes.STRING(30),
      allowNull: true,
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
    nota: {
      type: DataTypes.TEXT,
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
    precio_facturar: {
      type: DataTypes.ENUM('precio_1', 'precio_2', 'precio_3'),
      allowNull: false,
      defaultValue: 'precio_1',
    },
    porcentaje_descuento: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    codigo: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    id_vendedor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    zona: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    credito_maximo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
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
