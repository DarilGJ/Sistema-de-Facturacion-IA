import { sequelize } from '../config/sequelize.js';

const COLUMN_DEFS = {
  tipo_identificacion:
    "ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero') NOT NULL DEFAULT 'nit'",
  tipo_persona: "ENUM('juridico', 'individual') NOT NULL DEFAULT 'juridico'",
  nombre: 'VARCHAR(160) NULL',
  razon_social: 'VARCHAR(160) NULL',
  nit: 'VARCHAR(30) NULL',
  direccion: 'VARCHAR(255) NULL',
  pais: 'VARCHAR(80) NULL',
  telefono2: 'VARCHAR(30) NULL',
  email2: 'VARCHAR(160) NULL',
  email3: 'VARCHAR(160) NULL',
  metodo_cancelacion: "ENUM('contado', 'credito') NOT NULL DEFAULT 'contado'",
  plazo_unidad: "ENUM('dias', 'meses', 'anio') NOT NULL DEFAULT 'dias'",
  plazo: 'INT UNSIGNED NOT NULL DEFAULT 0',
};

export async function ensureProveedorSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proveedores'`
  );
  const existing = new Set(rows.map((row) => row.name || row.COLUMN_NAME || row.column_name));
  const additions = Object.entries(COLUMN_DEFS)
    .filter(([name]) => !existing.has(name))
    .map(([name, def]) => `ADD COLUMN \`${name}\` ${def}`);

  if (!additions.length) {
    return;
  }

  await sequelize.query(`ALTER TABLE proveedores ${additions.join(', ')}`);
}
