import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Producto = sequelize.define(
  'Producto',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El SKU es obligatorio' },
      },
    },
    nombre: {
      type: DataTypes.STRING(160),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del producto es obligatorio' },
      },
    },
    tipo: {
      type: DataTypes.ENUM('producto', 'servicio'),
      allowNull: false,
      defaultValue: 'producto',
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ubicacion: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    unidad_medida: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'unidad',
    },
    categoria: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    subcategoria: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    marca: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    impuesto_tipo: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    impuesto_nombre: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    impuesto_porcentaje: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 12,
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'El precio de venta debe ser numérico' },
        min: { args: [0], msg: 'El precio de venta no puede ser negativo' },
      },
    },
    precio_2: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    precio_3: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    costo_compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'El costo de compra debe ser numérico' },
        min: { args: [0], msg: 'El costo de compra no puede ser negativo' },
      },
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock actual no puede ser negativo' },
      },
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'El stock mínimo no puede ser negativo' },
      },
    },
    stock_reorden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stock_maximo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unidad_compra: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    factor_conversion: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 1,
    },
    es_padre_variantes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bodega: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    id_proveedor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'productos',
  }
);
