import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Almacen,
  Categoria,
  Cliente,
  ClientePayload,
  Existencia,
  VendedorOpcion,
  Movimiento,
  Producto,
  ProductoPayload,
  Proveedor,
  ProveedorPayload,
} from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly proveedores = signal<Proveedor[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly vendedores = signal<VendedorOpcion[]>([]);
  readonly productos = signal<Producto[]>([]);

  readonly categorias = signal<Categoria[]>([
    { id: 1, nombre: 'Papelería', descripcion: 'Hojas, tintas y artículos de oficina', productos: 12 },
    { id: 2, nombre: 'Tecnología', descripcion: 'Equipos y accesorios informáticos', productos: 8 },
    { id: 3, nombre: 'Limpieza', descripcion: 'Insumos de aseo e higiene', productos: 6 },
    { id: 4, nombre: 'Servicios', descripcion: 'Ítems facturables sin stock físico', productos: 3 },
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

  listarProveedores(): Observable<Proveedor[]> {
    return this.http
      .get<Proveedor[]>(`${this.api}/proveedores`)
      .pipe(tap((rows) => this.proveedores.set(rows)));
  }

  crearProveedor(payload: ProveedorPayload): Observable<Proveedor[]> {
    return this.http
      .post<Proveedor>(`${this.api}/proveedores`, payload)
      .pipe(switchMap(() => this.listarProveedores()));
  }

  actualizarProveedor(id: number, payload: ProveedorPayload): Observable<Proveedor[]> {
    return this.http
      .put<Proveedor>(`${this.api}/proveedores/${id}`, payload)
      .pipe(switchMap(() => this.listarProveedores()));
  }

  desactivarProveedor(id: number): Observable<Proveedor[]> {
    return this.http
      .delete(`${this.api}/proveedores/${id}`)
      .pipe(switchMap(() => this.listarProveedores()));
  }

  listarVendedores(): Observable<VendedorOpcion[]> {
    return this.http
      .get<VendedorOpcion[]>(`${this.api}/auth/vendedores`)
      .pipe(tap((rows) => this.vendedores.set(rows)));
  }

  listarClientes(): Observable<Cliente[]> {
    return this.http
      .get<Cliente[]>(`${this.api}/clientes`)
      .pipe(tap((rows) => this.clientes.set(rows)));
  }

  crearCliente(payload: ClientePayload): Observable<Cliente[]> {
    return this.http
      .post<Cliente>(`${this.api}/clientes`, payload)
      .pipe(switchMap(() => this.listarClientes()));
  }

  actualizarCliente(id: number, payload: ClientePayload): Observable<Cliente[]> {
    return this.http
      .put<Cliente>(`${this.api}/clientes/${id}`, payload)
      .pipe(switchMap(() => this.listarClientes()));
  }

  desactivarCliente(id: number): Observable<Cliente[]> {
    return this.http
      .delete(`${this.api}/clientes/${id}`)
      .pipe(switchMap(() => this.listarClientes()));
  }

  listarProductos(): Observable<Producto[]> {
    return this.http
      .get<Producto[]>(`${this.api}/productos`)
      .pipe(tap((rows) => this.productos.set(rows)));
  }

  crearProducto(payload: ProductoPayload): Observable<Producto[]> {
    return this.http
      .post<Producto>(`${this.api}/productos`, payload)
      .pipe(switchMap(() => this.listarProductos()));
  }

  actualizarProducto(id: number, payload: ProductoPayload): Observable<Producto[]> {
    return this.http
      .put<Producto>(`${this.api}/productos/${id}`, payload)
      .pipe(switchMap(() => this.listarProductos()));
  }

  desactivarProducto(id: number): Observable<Producto[]> {
    return this.http
      .delete(`${this.api}/productos/${id}`)
      .pipe(switchMap(() => this.listarProductos()));
  }

  cargarCatalogos(): Observable<{ proveedores: Proveedor[]; clientes: Cliente[]; productos: Producto[] }> {
    return forkJoin({
      proveedores: this.listarProveedores(),
      clientes: this.listarClientes(),
      productos: this.listarProductos(),
    });
  }
}
