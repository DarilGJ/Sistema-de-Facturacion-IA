import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Factura = sequelize.define(
  'Factura',
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
    id_cliente: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
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
    tipo_factura: {
      type: DataTypes.ENUM('factura', 'factura_especial', 'factura_cambiaria', 'recibo'),
      allowNull: false,
      defaultValue: 'factura',
    },
    tributacion: {
      type: DataTypes.ENUM('no_entregado', 'aceptadas', 'rechazadas', 'desconocido'),
      allowNull: false,
      defaultValue: 'desconocido',
    },
    archivado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    correo_estado: {
      type: DataTypes.ENUM('no_entregado', 'enviado'),
      allowNull: false,
      defaultValue: 'no_entregado',
    },
    vendedor: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    moneda: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'Quetzal',
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    autorizacion: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    serie: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    numero_dte: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    itbis: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('emitida', 'anulada', 'pendiente', 'cancelada'),
      allowNull: false,
      defaultValue: 'emitida',
    },
  },
  {
    tableName: 'facturas',
  }
);
