import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Almacen,
  Categoria,
  CategoriaPayload,
  Subcategoria,
  SubcategoriaPayload,
  Marca,
  MarcaPayload,
  BodegaPayload,
  Cliente,
  ClientePayload,
  Existencia,
  VendedorOpcion,
  KardexPage,
  Producto,
  ProductoPayload,
  Proveedor,
  ProveedorPayload,
  InventarioConfig,
  AjusteInventario,
  AjustePayload,
  TrasladoInventario,
  TrasladoPayload,
  DevolucionInventario,
  DevolucionFactura,
  DevolucionPayload,
} from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly proveedores = signal<Proveedor[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly vendedores = signal<VendedorOpcion[]>([]);
  readonly productos = signal<Producto[]>([]);

  readonly categorias = signal<Categoria[]>([]);
  readonly subcategorias = signal<Subcategoria[]>([]);
  readonly marcas = signal<Marca[]>([]);
  readonly almacenes = signal<Almacen[]>([]);

  readonly existencias = signal<Existencia[]>([]);
  readonly ajustes = signal<AjusteInventario[]>([]);
  readonly traslados = signal<TrasladoInventario[]>([]);
  readonly devoluciones = signal<DevolucionInventario[]>([]);
  readonly kardex = signal<KardexPage['rows']>([]);
  readonly kardexTotal = signal(0);

  readonly config = signal<InventarioConfig>({
    control_lotes: false,
    bloquear_ventas_sin_stock: true,
    reserva_stock: false,
    merma_ajustes: false,
  });

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

  cargarCatalogos(): Observable<{
    proveedores: Proveedor[];
    clientes: Cliente[];
    productos: Producto[];
    categorias: Categoria[];
    subcategorias: Subcategoria[];
    marcas: Marca[];
    bodegas: Almacen[];
  }> {
    return forkJoin({
      proveedores: this.listarProveedores(),
      clientes: this.listarClientes(),
      productos: this.listarProductos(),
      categorias: this.listarCategorias(),
      subcategorias: this.listarSubcategorias(),
      marcas: this.listarMarcas(),
      bodegas: this.listarBodegas(),
    });
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http
      .get<Categoria[]>(`${this.api}/inventario/categorias`)
      .pipe(tap((rows) => this.categorias.set(rows)));
  }

  crearCategoria(payload: CategoriaPayload): Observable<Categoria[]> {
    return this.http
      .post<Categoria>(`${this.api}/inventario/categorias`, payload)
      .pipe(switchMap(() => this.listarCategorias()));
  }

  actualizarCategoria(id: number, payload: Partial<CategoriaPayload>): Observable<Categoria[]> {
    return this.http
      .put<Categoria>(`${this.api}/inventario/categorias/${id}`, payload)
      .pipe(switchMap(() => this.listarCategorias()));
  }

  listarSubcategorias(): Observable<Subcategoria[]> {
    return this.http
      .get<Subcategoria[]>(`${this.api}/inventario/subcategorias`)
      .pipe(tap((rows) => this.subcategorias.set(rows)));
  }

  crearSubcategoria(payload: SubcategoriaPayload): Observable<Subcategoria[]> {
    return this.http
      .post<Subcategoria>(`${this.api}/inventario/subcategorias`, payload)
      .pipe(switchMap(() => this.listarSubcategorias()));
  }

  actualizarSubcategoria(id: number, payload: Partial<SubcategoriaPayload>): Observable<Subcategoria[]> {
    return this.http
      .put<Subcategoria>(`${this.api}/inventario/subcategorias/${id}`, payload)
      .pipe(switchMap(() => this.listarSubcategorias()));
  }

  listarMarcas(): Observable<Marca[]> {
    return this.http
      .get<Marca[]>(`${this.api}/inventario/marcas`)
      .pipe(tap((rows) => this.marcas.set(rows)));
  }

  crearMarca(payload: MarcaPayload): Observable<Marca[]> {
    return this.http
      .post<Marca>(`${this.api}/inventario/marcas`, payload)
      .pipe(switchMap(() => this.listarMarcas()));
  }

  actualizarMarca(id: number, payload: Partial<MarcaPayload>): Observable<Marca[]> {
    return this.http
      .put<Marca>(`${this.api}/inventario/marcas/${id}`, payload)
      .pipe(switchMap(() => this.listarMarcas()));
  }

  listarBodegas(): Observable<Almacen[]> {
    return this.http
      .get<Almacen[]>(`${this.api}/inventario/bodegas`)
      .pipe(tap((rows) => this.almacenes.set(rows)));
  }

  crearBodega(payload: BodegaPayload): Observable<Almacen[]> {
    return this.http
      .post<Almacen>(`${this.api}/inventario/bodegas`, payload)
      .pipe(switchMap(() => this.listarBodegas()));
  }

  actualizarBodega(id: number, payload: Partial<BodegaPayload>): Observable<Almacen[]> {
    return this.http
      .put<Almacen>(`${this.api}/inventario/bodegas/${id}`, payload)
      .pipe(switchMap(() => this.listarBodegas()));
  }

  listarExistencias(idBodega: number): Observable<Existencia[]> {
    return this.http
      .get<Existencia[]>(`${this.api}/inventario/existencias`, { params: { id_bodega: String(idBodega) } })
      .pipe(tap((rows) => this.existencias.set(rows)));
  }

  guardarExistencias(
    idBodega: number,
    productos: Array<{ id_producto: number; cantidad: number }>
  ): Observable<Existencia[]> {
    return this.http
      .put<Existencia[]>(`${this.api}/inventario/existencias/${idBodega}`, { productos })
      .pipe(tap((rows) => this.existencias.set(rows)));
  }

  listarAjustes(): Observable<AjusteInventario[]> {
    return this.http
      .get<AjusteInventario[]>(`${this.api}/inventario/ajustes`)
      .pipe(tap((rows) => this.ajustes.set(rows)));
  }

  obtenerAjuste(id: number): Observable<AjusteInventario> {
    return this.http.get<AjusteInventario>(`${this.api}/inventario/ajustes/${id}`);
  }

  descargarAjusteExcel(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/inventario/ajustes/${id}/excel`, {
      responseType: 'blob',
    });
  }

  crearAjuste(payload: AjustePayload): Observable<AjusteInventario> {
    return this.http
      .post<AjusteInventario>(`${this.api}/inventario/ajustes`, payload)
      .pipe(
        tap((created) => this.ajustes.update((lista) => [created, ...lista.filter((row) => row.id !== created.id)]))
      );
  }

  listarTraslados(): Observable<TrasladoInventario[]> {
    return this.http
      .get<TrasladoInventario[]>(`${this.api}/inventario/traslados`)
      .pipe(tap((rows) => this.traslados.set(rows)));
  }

  crearTraslado(payload: TrasladoPayload): Observable<TrasladoInventario> {
    return this.http
      .post<TrasladoInventario>(`${this.api}/inventario/traslados`, payload)
      .pipe(
        tap((created) => this.traslados.update((lista) => [created, ...lista.filter((row) => row.id !== created.id)]))
      );
  }

  anularTraslado(id: number): Observable<TrasladoInventario> {
    return this.http
      .post<TrasladoInventario>(`${this.api}/inventario/traslados/${id}/anular`, {})
      .pipe(
        tap((updated) =>
          this.traslados.update((lista) => lista.map((row) => (row.id === updated.id ? updated : row)))
        )
      );
  }

  descargarTrasladoExcel(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/inventario/traslados/${id}/excel`, {
      responseType: 'blob',
    });
  }

  listarDevoluciones(): Observable<DevolucionInventario[]> {
    return this.http
      .get<DevolucionInventario[]>(`${this.api}/inventario/devoluciones`)
      .pipe(tap((rows) => this.devoluciones.set(rows)));
  }

  facturaDevolucion(idFactura: number): Observable<DevolucionFactura> {
    return this.http.get<DevolucionFactura>(`${this.api}/inventario/devoluciones/factura/${idFactura}`);
  }

  crearDevolucion(payload: DevolucionPayload): Observable<DevolucionInventario> {
    return this.http.post<DevolucionInventario>(`${this.api}/inventario/devoluciones`, payload).pipe(
      tap((created) =>
        this.devoluciones.update((lista) => [created, ...lista.filter((row) => row.id !== created.id)])
      )
    );
  }

  listarKardex(params: {
    q?: string;
    proceso?: string;
    documento_origen?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
  }): Observable<KardexPage> {
    const query: Record<string, string> = {};
    if (params.q) query['q'] = params.q;
    if (params.proceso) query['proceso'] = params.proceso;
    if (params.documento_origen) query['documento_origen'] = params.documento_origen;
    if (params.desde) query['desde'] = params.desde;
    if (params.hasta) query['hasta'] = params.hasta;
    query['page'] = String(params.page || 1);
    query['size'] = String(params.size || 20);
    return this.http.get<KardexPage>(`${this.api}/inventario/movimientos`, { params: query }).pipe(
      tap((page) => {
        this.kardex.set(page.rows);
        this.kardexTotal.set(page.total);
      })
    );
  }

  cargarConfig(): Observable<InventarioConfig> {
    return this.http
      .get<InventarioConfig>(`${this.api}/inventario/config`)
      .pipe(tap((config) => this.config.set(config)));
  }

  actualizarConfig(payload: Partial<InventarioConfig>): Observable<InventarioConfig> {
    return this.http
      .put<InventarioConfig>(`${this.api}/inventario/config`, payload)
      .pipe(tap((config) => this.config.set(config)));
  }
}
