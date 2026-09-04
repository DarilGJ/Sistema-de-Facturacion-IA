import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { testSequelize } from './config/sequelize.js';
import { sequelize } from './models/index.js';
import { ensureClienteSchema } from './utils/ensure-cliente-schema.js';
import { ensureProveedorSchema } from './utils/ensure-proveedor-schema.js';
import { ensureProductoSchema } from './utils/ensure-producto-schema.js';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import proveedorRoutes from './routes/proveedor.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import productoRoutes from './routes/producto.routes.js';
import facturaRoutes from './routes/factura.routes.js';
import cotizacionRoutes from './routes/cotizacion.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/cotizaciones', cotizacionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

async function start() {
  try {
    await testSequelize();
    await sequelize.sync();
    await ensureClienteSchema();
    await ensureProveedorSchema();
    await ensureProductoSchema();
    console.log('MySQL (Sequelize) conectado y modelos sincronizados');
  } catch (error) {
    console.warn('Advertencia: no se pudo conectar a MySQL todavía.');
    console.warn(error.message);
    console.warn('Revisa backend/.env y ejecuta database/schema.sql');
  }

  app.listen(env.port, () => {
    console.log(`API escuchando en http://localhost:${env.port}`);
  });
}

start();
