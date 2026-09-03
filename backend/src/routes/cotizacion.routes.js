import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import { actualizarEstado, convertirAFactura, crear, listar, obtenerPorId } from '../controllers/cotizacion.controller.js';

const router = Router();

router.use(authRequired);

router.post('/', crear);
router.get('/', listar);
router.post('/:id/facturar', convertirAFactura);
router.get('/:id', obtenerPorId);
router.patch('/:id', actualizarEstado);

export default router;
