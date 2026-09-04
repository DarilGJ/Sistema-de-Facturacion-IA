import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Compra = sequelize.define(
  'Compra',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    numero_proveedor: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    id_proveedor: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_bodega: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    metodo_pago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia'),
      allowNull: false,
      defaultValue: 'efectivo',
    },
    condicion_venta: {
      type: DataTypes.ENUM('contado', 'credito'),
      allowNull: false,
      defaultValue: 'contado',
    },
    moneda: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'Quetzal',
    },
    vendedor: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    canal: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    requerimientos: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    plazo: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    plazo_unidad: {
      type: DataTypes.ENUM('dias', 'meses', 'anio'),
      allowNull: false,
      defaultValue: 'dias',
    },
    vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    iva: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    archivado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'cancelada', 'anulada'),
      allowNull: false,
      defaultValue: 'cancelada',
    },
  },
  { tableName: 'compras' }
);
