import { Router } from 'express';
import { login, findUserByEmail, findUserById, listVendedores, createUser } from '../services/auth.service.js';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';
import { limpiarIntentos, registrarFallo, verificarIntento } from '../utils/login-attempts.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const correo = String(email).trim().toLowerCase();
    verificarIntento(correo);
    const result = await login(correo, password);
    limpiarIntentos(correo);
    return res.json(result);
  } catch (error) {
    if (error.status === 401 && req.body?.email) {
      registrarFallo(req.body.email);
    }
    const status = error.status || 500;
    return res.status(status).json({
      message: status === 500 ? 'Error interno del servidor' : error.message,
    });
  }
});

router.post('/usuarios', authRequired, requireRole('admin'), async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const rol = ['admin', 'vendedor', 'contador'].includes(req.body?.rol) ? req.body.rol : 'vendedor';
    if (!nombre || !email || password.length < 6) {
      return res.status(400).json({ message: 'Nombre, correo y una contraseña de al menos 6 caracteres son requeridos' });
    }
    const existente = await findUserByEmail(email);
    if (existente) {
      return res.status(200).json({
        user: { id: existente.id, nombre: existente.nombre, email: existente.email, rol: existente.rol },
      });
    }
    const user = await createUser({ nombre, email, password, rol });
    return res.status(201).json({ user });
  } catch {
    return res.status(500).json({ message: 'No se pudo crear el usuario' });
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
