import { sequelize } from '../config/sequelize.js';

const COLUMN_DEFS = {
  tipo: "ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto'",
  detalle: 'TEXT NULL',
  ubicacion: 'VARCHAR(160) NULL',
  unidad_medida: "VARCHAR(40) NOT NULL DEFAULT 'unidad'",
  impuesto_tipo: 'VARCHAR(40) NULL',
  impuesto_nombre: 'VARCHAR(80) NULL',
  impuesto_porcentaje: 'DECIMAL(8, 2) NOT NULL DEFAULT 12',
  precio_2: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
  precio_3: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
  stock_reorden: 'INT NOT NULL DEFAULT 0',
  stock_maximo: 'INT NOT NULL DEFAULT 0',
  subcategoria: 'VARCHAR(80) NULL',
  marca: 'VARCHAR(80) NULL',
  unidad_compra: 'VARCHAR(40) NULL',
  factor_conversion: 'DECIMAL(12, 4) NOT NULL DEFAULT 1',
  es_padre_variantes: 'TINYINT(1) NOT NULL DEFAULT 0',
  bodega: 'VARCHAR(120) NULL',
};

export async function ensureProductoSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'`
  );
  const existing = new Set(rows.map((row) => row.name || row.COLUMN_NAME || row.column_name));
  const additions = Object.entries(COLUMN_DEFS)
    .filter(([name]) => !existing.has(name))
    .map(([name, def]) => `ADD COLUMN \`${name}\` ${def}`);

  if (!additions.length) {
    return;
  }

  await sequelize.query(`ALTER TABLE productos ${additions.join(', ')}`);
}
