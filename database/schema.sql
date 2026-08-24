CREATE DATABASE IF NOT EXISTS sistema_facturacion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_facturacion;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'vendedor', 'contador') NOT NULL DEFAULT 'vendedor',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Usuario demo:
-- email: admin@demo.com
-- password: Admin123!
-- Hash generado con bcrypt (cost 10)
INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
VALUES (
  'Administrador',
  'admin@demo.com',
  '$2b$10$z11DdWNDoFiPM6JHS1Gi4.VpBByi/R7UAT44fRrvgEi8Cqs1QJgAy',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE email = email;
