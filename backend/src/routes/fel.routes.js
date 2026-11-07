import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.middleware.js';
import { Factura } from '../models/index.js';
import { estadoFel, aplicarCertificacion } from '../services/fel.service.js';

const router = Router();

router.use(authRequired);

router.get('/estado', (_req, res) => {
  res.json(estadoFel());
});

router.post('/certificar/:id', requireRole('admin', 'contador'), async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    if (factura.autorizacion) {
      return res.status(400).json({ message: 'La factura ya tiene autorización del certificador' });
    }
    if (factura.estado === 'anulada') {
      return res.status(400).json({ message: 'No se puede certificar una factura anulada' });
    }
    const fel = await aplicarCertificacion(factura);
    const actualizada = await Factura.findByPk(factura.id);
    return res.status(fel.estado === 'aceptadas' ? 200 : 409).json({ fel, factura: actualizada });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'No se pudo certificar' });
  }
});

export default router;
