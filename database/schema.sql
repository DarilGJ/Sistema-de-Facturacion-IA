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

CREATE TABLE IF NOT EXISTS proveedores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_identificacion ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero') NOT NULL DEFAULT 'nit',
  tipo_persona ENUM('juridico', 'individual') NOT NULL DEFAULT 'juridico',
  nombre VARCHAR(160) NULL,
  razon_social VARCHAR(160) NULL,
  nit VARCHAR(30) NULL,
  nombre_comercial VARCHAR(160) NOT NULL,
  contacto VARCHAR(120) NULL,
  telefono VARCHAR(30) NULL,
  telefono2 VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  email2 VARCHAR(160) NULL,
  email3 VARCHAR(160) NULL,
  direccion VARCHAR(255) NULL,
  pais VARCHAR(80) NULL,
  metodo_cancelacion ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
  plazo_unidad ENUM('dias', 'meses', 'anio') NOT NULL DEFAULT 'dias',
  plazo INT UNSIGNED NOT NULL DEFAULT 0,
  tiempo_entrega_dias INT UNSIGNED NOT NULL DEFAULT 1,
  estado TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_identificacion ENUM('nit', 'cui_dpi', 'consumidor_final', 'extranjero') NOT NULL DEFAULT 'nit',
  tipo_persona ENUM('juridico', 'individual') NOT NULL DEFAULT 'individual',
  nombre VARCHAR(160) NOT NULL,
  razon_social VARCHAR(160) NULL,
  nit VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(160) NULL,
  telefono VARCHAR(30) NULL,
  direccion VARCHAR(255) NULL,
  pais VARCHAR(80) NULL,
  nombre_comercial VARCHAR(160) NULL,
  telefono2 VARCHAR(30) NULL,
  email2 VARCHAR(160) NULL,
  email3 VARCHAR(160) NULL,
  nota TEXT NULL,
  metodo_cancelacion ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
  plazo_unidad ENUM('dias', 'meses', 'anio') NOT NULL DEFAULT 'dias',
  plazo INT UNSIGNED NOT NULL DEFAULT 0,
  precio_facturar ENUM('precio_1', 'precio_2', 'precio_3') NOT NULL DEFAULT 'precio_1',
  porcentaje_descuento DECIMAL(5, 2) NOT NULL DEFAULT 0,
  codigo VARCHAR(40) NULL,
  id_vendedor INT UNSIGNED NULL,
  zona VARCHAR(80) NULL,
  credito_maximo DECIMAL(12, 2) NOT NULL DEFAULT 0,
  estado TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(160) NOT NULL,
  tipo ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
  detalle TEXT NULL,
  ubicacion VARCHAR(160) NULL,
  unidad_medida VARCHAR(40) NOT NULL DEFAULT 'unidad',
  categoria VARCHAR(80) NULL,
  subcategoria VARCHAR(80) NULL,
  marca VARCHAR(80) NULL,
  impuesto_tipo VARCHAR(40) NULL,
  impuesto_nombre VARCHAR(80) NULL,
  impuesto_porcentaje DECIMAL(8, 2) NOT NULL DEFAULT 12,
  precio_venta DECIMAL(10, 2) NOT NULL,
  precio_2 DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio_3 DECIMAL(12, 2) NOT NULL DEFAULT 0,
  costo_compra DECIMAL(10, 2) NOT NULL,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  stock_reorden INT NOT NULL DEFAULT 0,
  stock_maximo INT NOT NULL DEFAULT 0,
  unidad_compra VARCHAR(40) NULL,
  factor_conversion DECIMAL(12, 4) NOT NULL DEFAULT 1,
  es_padre_variantes TINYINT(1) NOT NULL DEFAULT 0,
  bodega VARCHAR(120) NULL,
  id_proveedor INT UNSIGNED NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_productos_proveedor
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS facturas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  id_cliente INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') NOT NULL DEFAULT 'efectivo',
  subtotal DECIMAL(12, 2) NOT NULL,
  itbis DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('emitida', 'anulada') NOT NULL DEFAULT 'emitida',
  CONSTRAINT fk_facturas_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS factura_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_factura INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  descripcion VARCHAR(160) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_factura_items_factura
    FOREIGN KEY (id_factura) REFERENCES facturas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_factura_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  id_cliente INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
  subtotal DECIMAL(12, 2) NOT NULL,
  itbis DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('pendiente', 'cancelada', 'archivada') NOT NULL DEFAULT 'pendiente',
  generada TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_cotizaciones_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cotizacion_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cotizacion INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  descripcion VARCHAR(160) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_cotizacion_items_cotizacion
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_cotizacion_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;
