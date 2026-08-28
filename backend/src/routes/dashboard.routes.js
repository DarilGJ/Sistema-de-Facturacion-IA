import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import { alertas, resumen } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authRequired);
router.get('/', resumen);
router.get('/alertas', alertas);

export default router;
