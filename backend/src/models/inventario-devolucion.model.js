import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const InventarioDevolucion = sequelize.define(
  'InventarioDevolucion',
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
    referencia_nc: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    id_factura: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_cliente: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    id_bodega: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    razon: {
      type: DataTypes.ENUM('danado', 'vencido', 'no_gusto', 'cambio_producto'),
      allowNull: false,
    },
    resolucion: {
      type: DataTypes.ENUM('reembolso_efectivo', 'nota_credito', 'cambio'),
      allowNull: false,
    },
    observacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subtotal_devuelto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    itbis_devuelto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_devuelto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    subtotal_cambio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    itbis_cambio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_cambio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    diferencia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reembolso: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cobro: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    nota_credito_monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    valor_inventario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    contabilizado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  },
  {
    tableName: 'inventario_devoluciones',
  }
);
