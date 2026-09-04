import { sequelize } from '../config/sequelize.js';

const COLUMN_DEFS = {
  condicion_venta: "ENUM('contado', 'credito') NOT NULL DEFAULT 'contado'",
  tipo_factura:
    "ENUM('factura', 'factura_especial', 'factura_cambiaria', 'recibo') NOT NULL DEFAULT 'factura'",
  tributacion:
    "ENUM('no_entregado', 'aceptadas', 'rechazadas', 'desconocido') NOT NULL DEFAULT 'desconocido'",
  archivado: 'TINYINT(1) NOT NULL DEFAULT 0',
  correo_estado: "ENUM('no_entregado', 'enviado') NOT NULL DEFAULT 'no_entregado'",
  vendedor: 'VARCHAR(120) NULL',
  moneda: "VARCHAR(40) NOT NULL DEFAULT 'Quetzal'",
  descuento: 'DECIMAL(12, 2) NOT NULL DEFAULT 0',
  autorizacion: 'VARCHAR(64) NULL',
  serie: 'VARCHAR(20) NULL',
  numero_dte: 'VARCHAR(20) NULL',
  notas: 'TEXT NULL',
};

export async function ensureFacturaSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS col_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facturas'`
  );
  const existing = new Set(rows.map((row) => row.name || row.COLUMN_NAME || row.column_name));
  const additions = Object.entries(COLUMN_DEFS)
    .filter(([name]) => !existing.has(name))
    .map(([name, def]) => `ADD COLUMN \`${name}\` ${def}`);

  if (additions.length) {
    await sequelize.query(`ALTER TABLE facturas ${additions.join(', ')}`);
  }

  const estadoCol = rows.find((row) => (row.name || row.COLUMN_NAME) === 'estado');
  const estadoType = String(estadoCol?.col_type || estadoCol?.COLUMN_TYPE || '');
  if (estadoType && !estadoType.includes('pendiente')) {
    await sequelize.query(
      `ALTER TABLE facturas
       MODIFY COLUMN estado ENUM('emitida', 'anulada', 'pendiente', 'cancelada') NOT NULL DEFAULT 'emitida'`
    );
  }
}
