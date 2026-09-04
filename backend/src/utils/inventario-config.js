import { InventarioConfig } from '../models/inventario-config.model.js';

export const DEFAULT_INVENTARIO_CONFIG = {
  control_lotes: false,
  bloquear_ventas_sin_stock: true,
  reserva_stock: false,
  merma_ajustes: false,
};

function asBool(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  return value === true || value === 1 || value === '1';
}

export function toInventarioConfigDto(row) {
  return {
    control_lotes: asBool(row?.control_lotes, DEFAULT_INVENTARIO_CONFIG.control_lotes),
    bloquear_ventas_sin_stock: asBool(
      row?.bloquear_ventas_sin_stock,
      DEFAULT_INVENTARIO_CONFIG.bloquear_ventas_sin_stock
    ),
    reserva_stock: asBool(row?.reserva_stock, DEFAULT_INVENTARIO_CONFIG.reserva_stock),
    merma_ajustes: asBool(row?.merma_ajustes, DEFAULT_INVENTARIO_CONFIG.merma_ajustes),
  };
}

export async function getOrCreateInventarioConfig() {
  const [row] = await InventarioConfig.findOrCreate({
    where: { id: 1 },
    defaults: { id: 1, ...DEFAULT_INVENTARIO_CONFIG },
  });
  return row;
}
