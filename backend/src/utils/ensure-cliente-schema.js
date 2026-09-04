import { sequelize } from '../config/sequelize.js';

const COLUMN_DEFS = {
  tipo_identificacion:
    "ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero') NOT NULL DEFAULT 'nit'",
  tipo_persona: "ENUM('juridico', 'individual') NOT NULL DEFAULT 'individual'",
  razon_social: 'VARCHAR(160) NULL',
  direccion: 'VARCHAR(255) NULL',
  pais: 'VARCHAR(80) NULL',
  nombre_comercial: 'VARCHAR(160) NULL',
  telefono2: 'VARCHAR(30) NULL',
  email2: 'VARCHAR(160) NULL',
  email3: 'VARCHAR(160) NULL',
  nota: 'TEXT NULL',
  metodo_cancelacion: "ENUM('contado', 'credito') NOT NULL DEFAULT 'contado'",
  plazo_unidad: "ENUM('dias', 'meses', 'anio') NOT NULL DEFAULT 'dias'",
  plazo: 'INT UNSIGNED NOT NULL DEFAULT 0',
  precio_facturar: "ENUM('precio_1', 'precio_2', 'precio_3') NOT NULL DEFAULT 'precio_1'",
  porcentaje_descuento: 'DECIMAL(5, 2) NOT NULL DEFAULT 0',
  codigo: 'VARCHAR(40) NULL',
  id_vendedor: 'INT UNSIGNED NULL',
  zona: 'VARCHAR(80) NULL',
  credito_maximo: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
};

export async function ensureClienteSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes'`
  );
  const existing = new Set(rows.map((row) => row.name || row.COLUMN_NAME || row.column_name));
  const additions = Object.entries(COLUMN_DEFS)
    .filter(([name]) => !existing.has(name))
    .map(([name, def]) => `ADD COLUMN \`${name}\` ${def}`);

  if (!additions.length) {
    return;
  }

  await sequelize.query(`ALTER TABLE clientes ${additions.join(', ')}`);
}
