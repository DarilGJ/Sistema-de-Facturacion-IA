import { Router } from 'express';
import { authRequired } from '../middleware/auth.middleware.js';
import { actualizar, obtener } from '../controllers/inventario-config.controller.js';
import {
  actualizar as actualizarCategoria,
  crear as crearCategoria,
  listar as listarCategorias,
} from '../controllers/categoria.controller.js';
import {
  actualizar as actualizarSubcategoria,
  crear as crearSubcategoria,
  listar as listarSubcategorias,
} from '../controllers/subcategoria.controller.js';
import {
  actualizar as actualizarMarca,
  crear as crearMarca,
  listar as listarMarcas,
} from '../controllers/marca.controller.js';
import {
  actualizar as actualizarBodega,
  crear as crearBodega,
  listar as listarBodegas,
} from '../controllers/bodega.controller.js';
import {
  guardar as guardarExistencias,
  listar as listarExistencias,
} from '../controllers/existencia.controller.js';
import {
  crear as crearAjuste,
  descargarExcel as descargarAjusteExcel,
  listar as listarAjustes,
  obtener as obtenerAjuste,
} from '../controllers/ajuste.controller.js';
import {
  anular as anularTraslado,
  crear as crearTraslado,
  descargarExcel as descargarTrasladoExcel,
  listar as listarTraslados,
  obtener as obtenerTraslado,
} from '../controllers/traslado.controller.js';
import { listar as listarMovimientos } from '../controllers/movimiento.controller.js';
import {
  crear as crearDevolucion,
  facturaDisponible,
  listar as listarDevoluciones,
  obtener as obtenerDevolucion,
} from '../controllers/devolucion.controller.js';

const router = Router();

router.use(authRequired);
router.get('/config', obtener);
router.put('/config', actualizar);
router.get('/categorias', listarCategorias);
router.post('/categorias', crearCategoria);
router.put('/categorias/:id', actualizarCategoria);
router.get('/subcategorias', listarSubcategorias);
router.post('/subcategorias', crearSubcategoria);
router.put('/subcategorias/:id', actualizarSubcategoria);
router.get('/marcas', listarMarcas);
router.post('/marcas', crearMarca);
router.put('/marcas/:id', actualizarMarca);
router.get('/bodegas', listarBodegas);
router.post('/bodegas', crearBodega);
router.put('/bodegas/:id', actualizarBodega);
router.get('/existencias', listarExistencias);
router.put('/existencias/:idBodega', guardarExistencias);
router.get('/ajustes', listarAjustes);
router.post('/ajustes', crearAjuste);
router.get('/ajustes/:id/excel', descargarAjusteExcel);
router.get('/ajustes/:id', obtenerAjuste);
router.get('/traslados', listarTraslados);
router.post('/traslados', crearTraslado);
router.get('/traslados/:id/excel', descargarTrasladoExcel);
router.post('/traslados/:id/anular', anularTraslado);
router.get('/traslados/:id', obtenerTraslado);
router.get('/movimientos', listarMovimientos);
router.get('/devoluciones', listarDevoluciones);
router.post('/devoluciones', crearDevolucion);
router.get('/devoluciones/factura/:idFactura', facturaDisponible);
router.get('/devoluciones/:id', obtenerDevolucion);

export default router;
