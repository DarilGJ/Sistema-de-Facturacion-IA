import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export const Subcategoria = sequelize.define(
  'Subcategoria',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la subcategoría es obligatorio' },
      },
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    id_categoria: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'subcategorias',
    indexes: [
      {
        unique: true,
        fields: ['id_categoria', 'nombre'],
        name: 'uq_subcategorias_categoria_nombre',
      },
    ],
  }
);
