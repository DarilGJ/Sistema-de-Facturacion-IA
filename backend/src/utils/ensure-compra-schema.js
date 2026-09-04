import { sequelize } from '../config/sequelize.js';

export async function ensureCompraSchema() {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS col_type
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'compras'`
  );
  if (!rows.length) {
    return;
  }
  const existing = new Set(rows.map((row) => row.name || row.COLUMN_NAME));
  if (!existing.has('archivado')) {
    await sequelize.query(`ALTER TABLE compras ADD COLUMN archivado TINYINT(1) NOT NULL DEFAULT 0`);
  }

  const estadoCol = rows.find((row) => (row.name || row.COLUMN_NAME) === 'estado');
  const estadoType = String(estadoCol?.col_type || estadoCol?.COLUMN_TYPE || '');
  if (estadoType.includes('registrada') || !estadoType.includes('pendiente')) {
    await sequelize.query(
      `ALTER TABLE compras
       MODIFY COLUMN estado ENUM('registrada', 'pendiente', 'cancelada', 'anulada') NOT NULL DEFAULT 'cancelada'`
    );
    await sequelize.query(
      `UPDATE compras SET estado = CASE
         WHEN estado = 'registrada' AND condicion_venta = 'credito' THEN 'pendiente'
         WHEN estado = 'registrada' THEN 'cancelada'
         ELSE estado
       END`
    );
    await sequelize.query(
      `ALTER TABLE compras
       MODIFY COLUMN estado ENUM('pendiente', 'cancelada', 'anulada') NOT NULL DEFAULT 'cancelada'`
    );
  }
}
