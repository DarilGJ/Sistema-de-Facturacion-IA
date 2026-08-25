import { Injectable, signal } from '@angular/core';
import {
  Almacen,
  Categoria,
  Existencia,
  Movimiento,
  Producto,
  Proveedor,
} from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  readonly categorias = signal<Categoria[]>([
    { id: 1, nombre: 'Papelería', descripcion: 'Hojas, tintas y artículos de oficina', productos: 12 },
    { id: 2, nombre: 'Tecnología', descripcion: 'Equipos y accesorios informáticos', productos: 8 },
    { id: 3, nombre: 'Limpieza', descripcion: 'Insumos de aseo e higiene', productos: 6 },
    { id: 4, nombre: 'Servicios', descripcion: 'Ítems facturables sin stock físico', productos: 3 },
  ]);

  readonly productos = signal<Producto[]>([
    { id: 1, sku: 'PAP-001', nombre: 'Resma papel carta', categoria: 'Papelería', precio: 285, unidad: 'resma', activo: true },
    { id: 2, sku: 'PAP-014', nombre: 'Tinta laser negra', categoria: 'Papelería', precio: 1450, unidad: 'und', activo: true },
    { id: 3, sku: 'TEC-003', nombre: 'Mouse inalámbrico', categoria: 'Tecnología', precio: 890, unidad: 'und', activo: true },
    { id: 4, sku: 'TEC-021', nombre: 'Teclado USB', categoria: 'Tecnología', precio: 720, unidad: 'und', activo: true },
    { id: 5, sku: 'LIM-008', nombre: 'Detergente 5L', categoria: 'Limpieza', precio: 410, unidad: 'gal', activo: true },
    { id: 6, sku: 'SRV-001', nombre: 'Soporte técnico hora', categoria: 'Servicios', precio: 1200, unidad: 'hora', activo: false },
  ]);

  readonly almacenes = signal<Almacen[]>([
    { id: 1, nombre: 'Almacén central', ubicacion: 'Santo Domingo, Zona Industrial', responsable: 'Ana Pérez', activo: true },
    { id: 2, nombre: 'Sucursal Norte', ubicacion: 'Santiago, Calle Principal 45', responsable: 'Luis Gómez', activo: true },
    { id: 3, nombre: 'Bodega temporal', ubicacion: 'Boca Chica, almacén 2', responsable: 'María Cruz', activo: false },
  ]);

  readonly existencias = signal<Existencia[]>([
    { id: 1, producto: 'Resma papel carta', sku: 'PAP-001', almacen: 'Almacén central', cantidad: 84, minimo: 20 },
    { id: 2, producto: 'Tinta laser negra', sku: 'PAP-014', almacen: 'Almacén central', cantidad: 9, minimo: 12 },
    { id: 3, producto: 'Mouse inalámbrico', sku: 'TEC-003', almacen: 'Sucursal Norte', cantidad: 31, minimo: 10 },
    { id: 4, producto: 'Teclado USB', sku: 'TEC-021', almacen: 'Sucursal Norte', cantidad: 4, minimo: 8 },
    { id: 5, producto: 'Detergente 5L', sku: 'LIM-008', almacen: 'Almacén central', cantidad: 18, minimo: 6 },
  ]);

  readonly movimientos = signal<Movimiento[]>([
    { id: 18, fecha: '2026-08-24', tipo: 'entrada', producto: 'Resma papel carta', almacen: 'Almacén central', cantidad: 40, referencia: 'OC-1042' },
    { id: 17, fecha: '2026-08-23', tipo: 'salida', producto: 'Tinta laser negra', almacen: 'Almacén central', cantidad: 3, referencia: 'FAC-331' },
    { id: 16, fecha: '2026-08-22', tipo: 'ajuste', producto: 'Teclado USB', almacen: 'Sucursal Norte', cantidad: -2, referencia: 'AJ-015' },
    { id: 15, fecha: '2026-08-21', tipo: 'salida', producto: 'Mouse inalámbrico', almacen: 'Sucursal Norte', cantidad: 5, referencia: 'FAC-328' },
    { id: 14, fecha: '2026-08-20', tipo: 'entrada', producto: 'Detergente 5L', almacen: 'Almacén central', cantidad: 12, referencia: 'OC-1038' },
  ]);

  readonly proveedores = signal<Proveedor[]>([
    { id: 1, nombre: 'Papelería del Caribe', rnc: '101234567', telefono: '809-555-1200', correo: 'ventas@papeleria.do', activo: true },
    { id: 2, nombre: 'TecnoPlus SRL', rnc: '130987654', telefono: '809-555-4488', correo: 'compras@tecnoplus.do', activo: true },
    { id: 3, nombre: 'LimpiaMax', rnc: '401112233', telefono: '829-555-0091', correo: 'info@limpiamax.do', activo: false },
  ]);
}
