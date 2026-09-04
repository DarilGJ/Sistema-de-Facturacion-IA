import { sequelize } from '../config/sequelize.js';

export async function ensureCotizacionSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS col_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cotizaciones'`
  );
  const estadoCol = rows.find((row) => (row.name || row.COLUMN_NAME) === 'estado');
  const estadoType = String(estadoCol?.col_type || estadoCol?.COLUMN_TYPE || '');
  if (estadoType && !estadoType.includes('anulada')) {
    await sequelize.query(
      `ALTER TABLE cotizaciones
       MODIFY COLUMN estado ENUM('pendiente', 'cancelada', 'archivada', 'anulada') NOT NULL DEFAULT 'pendiente'`
    );
  }
}
