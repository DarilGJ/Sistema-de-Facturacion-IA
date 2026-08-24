import { Router } from 'express';
import axios from 'axios';
import { authRequired } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * Proxy hacia el motor de IA en Python.
 * Ejemplo: POST /api/ai/predict { "texto": "..." }
 */
router.post('/predict', authRequired, async (req, res) => {
  try {
    const response = await axios.post(
      `${env.aiEngineUrl}/predict`,
      req.body,
      { timeout: 30000 }
    );
    return res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({
      message: 'No se pudo contactar el motor de IA',
      detail: error.response?.data || error.message,
    });
  }
});

router.get('/health', authRequired, async (_req, res) => {
  try {
    const response = await axios.get(`${env.aiEngineUrl}/health`, { timeout: 5000 });
    return res.json(response.data);
  } catch (error) {
    return res.status(502).json({
      message: 'Motor de IA no disponible',
      detail: error.message,
    });
  }
});

export default router;
