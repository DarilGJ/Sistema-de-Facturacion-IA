import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_facturacion',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  aiEngineUrl: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  fel: {
    apiUrl: String(process.env.FEL_API_URL || '').trim(),
    token: String(process.env.FEL_API_TOKEN || '').trim(),
    nitEmisor: String(process.env.FEL_NIT_EMISOR || '').trim(),
    nombreEmisor: String(process.env.FEL_NOMBRE_EMISOR || 'Librerías El Regalito').trim(),
    establecimiento: String(process.env.FEL_ESTABLECIMIENTO || '1').trim(),
  },
};
