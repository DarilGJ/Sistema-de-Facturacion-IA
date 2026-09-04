import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import {
  actualizarDocumento,
  actualizarEstado,
  convertirAFactura,
  crear,
  listar,
  obtenerPorId,
} from '../controllers/cotizacion.controller.js';

const router = Router();

router.use(authRequired);

router.post('/', crear);
router.get('/', listar);
router.post('/:id/facturar', convertirAFactura);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizarDocumento);
router.patch('/:id', actualizarEstado);

export default router;
