import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import { actualizar, crear, listar, obtenerPorId } from '../controllers/factura.controller.js';

const router = Router();

router.use(authRequired);

router.post('/', crear);
router.get('/', listar);
router.get('/:id', obtenerPorId);
router.patch('/:id', actualizar);

export default router;
