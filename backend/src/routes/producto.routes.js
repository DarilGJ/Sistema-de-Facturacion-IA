import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminarLogico,
} from '../controllers/producto.controller.js';

const router = Router();

router.use(authRequired);

router.post('/', crear);
router.get('/', listar);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminarLogico);

export default router;
