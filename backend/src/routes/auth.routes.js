import { Router } from 'express';
import { login, findUserById, listVendedores } from '../services/auth.service.js';
import { authRequired } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const result = await login(String(email).trim().toLowerCase(), password);
    return res.json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: status === 500 ? 'Error interno del servidor' : error.message,
    });
  }
});

router.get('/vendedores', authRequired, async (_req, res) => {
  try {
    const vendedores = await listVendedores();
    return res.json(vendedores);
  } catch {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await findUserById(req.user.sub);
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }
    return res.json({ user });
  } catch {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
