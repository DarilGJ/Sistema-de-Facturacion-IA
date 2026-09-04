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
  condicion_venta ENUM('contado', 'credito') NOT NULL DEFAULT 'contado',
  tipo_factura ENUM('factura', 'factura_especial', 'factura_cambiaria', 'recibo') NOT NULL DEFAULT 'factura',
  tributacion ENUM('no_entregado', 'aceptadas', 'rechazadas', 'desconocido') NOT NULL DEFAULT 'desconocido',
  archivado TINYINT(1) NOT NULL DEFAULT 0,
  correo_estado ENUM('no_entregado', 'enviado') NOT NULL DEFAULT 'no_entregado',
  vendedor VARCHAR(120) NULL,
  moneda VARCHAR(40) NOT NULL DEFAULT 'Quetzal',
  descuento DECIMAL(12, 2) NOT NULL DEFAULT 0,
  autorizacion VARCHAR(64) NULL,
  serie VARCHAR(20) NULL,
  numero_dte VARCHAR(20) NULL,
  notas TEXT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  itbis DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  estado ENUM('emitida', 'anulada', 'pendiente', 'cancelada') NOT NULL DEFAULT 'emitida',
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

CREATE TABLE IF NOT EXISTS inventario_config (
  id INT UNSIGNED PRIMARY KEY,
  control_lotes TINYINT(1) NOT NULL DEFAULT 0,
  bloquear_ventas_sin_stock TINYINT(1) NOT NULL DEFAULT 1,
  reserva_stock TINYINT(1) NOT NULL DEFAULT 0,
  merma_ajustes TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO inventario_config (id, control_lotes, bloquear_ventas_sin_stock, reserva_stock, merma_ajustes)
VALUES (1, 0, 1, 0, 0)
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subcategorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL,
  id_categoria INT UNSIGNED NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_subcategorias_categoria_nombre (id_categoria, nombre),
  CONSTRAINT fk_subcategorias_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marcas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bodegas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL UNIQUE,
  ubicacion VARCHAR(255) NULL,
  tipo ENUM('venta', 'materia_prima') NOT NULL DEFAULT 'venta',
  estado TINYINT(1) NOT NULL DEFAULT 1,
  principal TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bodega_productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_bodega INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_bodega_productos (id_bodega, id_producto),
  CONSTRAINT fk_bodega_productos_bodega
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_bodega_productos_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_ajustes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  descripcion VARCHAR(255) NULL,
  id_usuario INT UNSIGNED NULL,
  realizado_por VARCHAR(160) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contabilizado TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_ajuste_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_ajuste INT UNSIGNED NOT NULL,
  id_bodega INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad_anterior INT NOT NULL,
  tipo ENUM('mas', 'menos') NOT NULL,
  cantidad_ajuste INT UNSIGNED NOT NULL,
  cantidad_final INT NOT NULL,
  CONSTRAINT fk_ajuste_items_ajuste
    FOREIGN KEY (id_ajuste) REFERENCES inventario_ajustes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ajuste_items_bodega
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_traslados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_bodega_origen INT UNSIGNED NOT NULL,
  id_bodega_destino INT UNSIGNED NOT NULL,
  id_usuario INT UNSIGNED NULL,
  realizado_por VARCHAR(160) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('finalizado', 'anulado') NOT NULL DEFAULT 'finalizado',
  tipo ENUM('interno', 'empresa') NOT NULL DEFAULT 'interno',
  CONSTRAINT fk_traslados_origen
    FOREIGN KEY (id_bodega_origen) REFERENCES bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_traslados_destino
    FOREIGN KEY (id_bodega_destino) REFERENCES bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_traslado_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_traslado INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad_anterior INT NOT NULL,
  cantidad_traslado INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_traslado_items_traslado
    FOREIGN KEY (id_traslado) REFERENCES inventario_traslados(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_traslado_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_devoluciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  referencia_nc VARCHAR(20) NULL,
  id_factura INT UNSIGNED NOT NULL,
  id_cliente INT UNSIGNED NOT NULL,
  id_bodega INT UNSIGNED NOT NULL,
  razon ENUM('danado', 'vencido', 'no_gusto', 'cambio_producto') NOT NULL,
  resolucion ENUM('reembolso_efectivo', 'nota_credito', 'cambio') NOT NULL,
  observacion VARCHAR(255) NULL,
  subtotal_devuelto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  itbis_devuelto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_devuelto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal_cambio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  itbis_cambio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_cambio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  diferencia DECIMAL(12, 2) NOT NULL DEFAULT 0,
  reembolso DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cobro DECIMAL(12, 2) NOT NULL DEFAULT 0,
  nota_credito_monto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  valor_inventario DECIMAL(12, 2) NOT NULL DEFAULT 0,
  contabilizado TINYINT(1) NOT NULL DEFAULT 0,
  id_usuario INT UNSIGNED NULL,
  realizado_por VARCHAR(160) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_devoluciones_factura
    FOREIGN KEY (id_factura) REFERENCES facturas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_devoluciones_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_devoluciones_bodega
    FOREIGN KEY (id_bodega) REFERENCES bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_devolucion_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_devolucion INT UNSIGNED NOT NULL,
  id_factura_item INT UNSIGNED NOT NULL,
  id_producto INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  restablece_stock TINYINT(1) NOT NULL DEFAULT 1,
  cantidad_anterior INT NOT NULL DEFAULT 0,
  cantidad_final INT NOT NULL DEFAULT 0,
  id_producto_cambio INT UNSIGNED NULL,
  cantidad_cambio INT UNSIGNED NOT NULL DEFAULT 0,
  precio_cambio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal_cambio DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cantidad_anterior_cambio INT NULL,
  cantidad_final_cambio INT NULL,
  CONSTRAINT fk_devolucion_items_devolucion
    FOREIGN KEY (id_devolucion) REFERENCES inventario_devoluciones(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_devolucion_items_factura_item
    FOREIGN KEY (id_factura_item) REFERENCES factura_items(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_devolucion_items_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_devolucion_items_producto_cambio
    FOREIGN KEY (id_producto_cambio) REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modulo VARCHAR(40) NOT NULL,
  proceso VARCHAR(40) NOT NULL,
  documento_origen VARCHAR(40) NOT NULL,
  documento VARCHAR(80) NOT NULL,
  id_producto INT UNSIGNED NULL,
  sku VARCHAR(60) NOT NULL DEFAULT '',
  producto VARCHAR(160) NOT NULL,
  cantidad INT NOT NULL,
  id_bodega INT UNSIGNED NULL,
  bodega VARCHAR(160) NOT NULL DEFAULT '',
  usuario VARCHAR(160) NOT NULL DEFAULT '',
  KEY idx_movimientos_fecha (fecha),
  KEY idx_movimientos_proceso (proceso),
  KEY idx_movimientos_origen (documento_origen),
  KEY idx_movimientos_documento (documento)
) ENGINE=InnoDB;
