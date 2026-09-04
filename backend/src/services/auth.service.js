import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, nombre, email, password_hash, rol, activo
     FROM usuarios
     WHERE email = :email
     LIMIT 1`,
    { email }
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, nombre, email, rol, activo, creado_en
     FROM usuarios
     WHERE id = :id
     LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

export async function listVendedores() {
  const [rows] = await pool.execute(
    `SELECT id, nombre, email, rol
     FROM usuarios
     WHERE activo = 1 AND rol IN ('vendedor', 'admin')
     ORDER BY nombre ASC`
  );
  return rows;
}

export async function login(email, password) {
  const user = await findUserByEmail(email);

  if (!user || !user.activo) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  const payload = {
    sub: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
  };

  const token = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  };
}
