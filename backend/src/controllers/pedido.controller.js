import { construirPedidoSugerido } from '../services/pedido-sugerido.js';
import { handleSequelizeError } from '../utils/http-error.js';

export async function sugerido(_req, res) {
  try {
    const pedido = await construirPedidoSugerido();
    return res.status(200).json(pedido);
  } catch (error) {
    console.error(error);
    return handleSequelizeError(error, res);
  }
}
