import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import { actualizar, crear, eliminar, listar } from '../controllers/registro.controller.js';

const router = Router();

router.use(authRequired);
router.get('/', listar);
router.post('/', crear);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
