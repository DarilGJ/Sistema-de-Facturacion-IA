import { handleSequelizeError } from '../utils/http-error.js';
import {
  DEFAULT_INVENTARIO_CONFIG,
  getOrCreateInventarioConfig,
  toInventarioConfigDto,
} from '../utils/inventario-config.js';

function payloadFromBody(body) {
  const data = {};
  for (const key of Object.keys(DEFAULT_INVENTARIO_CONFIG)) {
    if (body[key] !== undefined) {
      data[key] = Boolean(body[key]);
    }
  }
  return data;
}

export async function obtener(_req, res) {
  try {
    const row = await getOrCreateInventarioConfig();
    return res.status(200).json(toInventarioConfigDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}

export async function actualizar(req, res) {
  try {
    const data = payloadFromBody(req.body || {});
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No hay cambios para guardar' });
    }

    const row = await getOrCreateInventarioConfig();
    await row.update(data);
    return res.status(200).json(toInventarioConfigDto(row));
  } catch (error) {
    return handleSequelizeError(error, res);
  }
}
