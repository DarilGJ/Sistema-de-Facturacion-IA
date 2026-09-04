import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { Existencia, TrasladoInventario } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice, PageToken } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

interface LineaTraslado {
  id_producto: number;
  sku: string;
  producto: string;
  bodega: string;
  cantidad_actual: number;
  cantidad_traslado: number;
}

@Component({
  selector: 'app-traslados',
  imports: [InventarioNav, UiIcon, DecimalPipe],
  templateUrl: './traslados.html',
  styleUrls: ['./inventario-shared.css', './categorias.css', './ajustes.css', './traslados.css'],
})
export class TrasladosInventario implements OnInit {
  readonly vista = signal<'realizados' | 'recibidos'>('realizados');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly formOpen = signal(false);
  readonly tiquete = signal<TrasladoInventario | null>(null);
  readonly menuId = signal<number | null>(null);

  readonly bodegaOrigenId = signal<number | null>(null);
  readonly bodegaDestinoId = signal<number | null>(null);
  readonly catalogo = signal<Existencia[]>([]);
  readonly loadingCatalogo = signal(false);
  readonly busquedaProducto = signal('');
  readonly paginaProducto = signal(1);
  readonly pageSizeProducto = signal(10);
  readonly seleccionados = signal<LineaTraslado[]>([]);
  readonly formError = signal('');

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.inventario.traslados().filter((item) => {
      if (!q) {
        return true;
      }
      return (
        String(item.id).includes(q) ||
        item.bodega_destino.toLowerCase().includes(q) ||
        item.bodega_origen.toLowerCase().includes(q) ||
        item.realizado_por.toLowerCase().includes(q) ||
        item.items.some((linea) => linea.producto.toLowerCase().includes(q) || linea.sku.toLowerCase().includes(q))
      );
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => compactPages(this.pagina(), this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() =>
    clampPage(this.pagina(), this.filtrados().length, this.pageSize())
  );
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(Math.max(this.filtrados().length, 0) / this.pageSize()))
  );

  readonly catalogoFiltrado = computed(() => {
    const q = this.busquedaProducto().trim().toLowerCase();
    const tomados = new Set(this.seleccionados().map((item) => item.id_producto));
    return this.catalogo().filter((item) => {
      if (tomados.has(item.id_producto)) {
        return false;
      }
      return !q || item.sku.toLowerCase().includes(q) || item.nombre.toLowerCase().includes(q);
    });
  });

  readonly productosVisibles = computed(() =>
    pageSlice(this.catalogoFiltrado(), this.paginaProducto(), this.pageSizeProducto())
  );
  readonly productosPaginas = computed(() =>
    compactPages(this.paginaProducto(), this.catalogoFiltrado().length, this.pageSizeProducto())
  );
  readonly productosRango = computed(() =>
    pageRange(this.catalogoFiltrado().length, this.paginaProducto(), this.pageSizeProducto())
  );
  readonly productosPaginaActual = computed(() =>
    clampPage(this.paginaProducto(), this.catalogoFiltrado().length, this.pageSizeProducto())
  );
  readonly productosTotalPaginas = computed(() =>
    Math.max(1, Math.ceil(Math.max(this.catalogoFiltrado().length, 0) / this.pageSizeProducto()))
  );

  readonly bodegasDestino = computed(() =>
    this.inventario.almacenes().filter((item) => item.estado && item.id !== this.bodegaOrigenId())
  );

  readonly puedeGuardar = computed(
    () =>
      !!this.bodegaOrigenId() &&
      !!this.bodegaDestinoId() &&
      this.bodegaOrigenId() !== this.bodegaDestinoId() &&
      this.seleccionados().length > 0 &&
      this.seleccionados().every((item) => item.cantidad_traslado > 0) &&
      !this.saving()
  );

  constructor(readonly inventario: InventarioService) {}

  ngOnInit(): void {
    this.cargar();
    this.inventario.listarBodegas().subscribe();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.saving()) {
      return;
    }
    if (this.tiquete()) {
      this.tiquete.set(null);
      return;
    }
    if (this.formOpen()) {
      this.cancelar();
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventario.listarTraslados().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los traslados.'));
      },
    });
  }

  setVista(vista: 'realizados' | 'recibidos'): void {
    this.vista.set(vista);
    this.pagina.set(1);
  }

  abrirNuevo(): void {
    this.formError.set('');
    this.bodegaOrigenId.set(null);
    this.bodegaDestinoId.set(null);
    this.catalogo.set([]);
    this.seleccionados.set([]);
    this.busquedaProducto.set('');
    this.paginaProducto.set(1);
    this.formOpen.set(true);
  }

  cancelar(): void {
    if (this.saving()) {
      return;
    }
    this.formOpen.set(false);
    this.formError.set('');
  }

  seleccionarOrigen(value: string): void {
    const id = Number(value) || null;
    this.bodegaOrigenId.set(id);
    this.catalogo.set([]);
    this.seleccionados.set([]);
    this.busquedaProducto.set('');
    this.paginaProducto.set(1);
    if (this.bodegaDestinoId() === id) {
      this.bodegaDestinoId.set(null);
    }
    this.formError.set('');
    if (!id) {
      return;
    }
    this.cargarCatalogo(id);
  }

  seleccionarDestino(value: string): void {
    this.bodegaDestinoId.set(Number(value) || null);
  }

  recargarCatalogo(): void {
    const id = this.bodegaOrigenId();
    if (id) {
      this.cargarCatalogo(id);
    }
  }

  agregar(item: Existencia): void {
    if (this.seleccionados().some((row) => row.id_producto === item.id_producto)) {
      return;
    }
    const bodega =
      this.inventario.almacenes().find((row) => row.id === item.id_bodega)?.nombre || '';
    this.seleccionados.update((lista) => [
      ...lista,
      {
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.nombre,
        bodega,
        cantidad_actual: item.cantidad,
        cantidad_traslado: 0,
      },
    ]);
  }

  quitar(item: LineaTraslado): void {
    this.seleccionados.update((lista) => lista.filter((row) => row.id_producto !== item.id_producto));
  }

  setCantidadTraslado(item: LineaTraslado, value: string): void {
    const n = Math.min(item.cantidad_actual, Math.max(0, Math.trunc(Number(value) || 0)));
    this.seleccionados.update((lista) =>
      lista.map((row) => (row.id_producto === item.id_producto ? { ...row, cantidad_traslado: n } : row))
    );
  }

  cantidadFinal(item: LineaTraslado): number {
    return item.cantidad_actual - item.cantidad_traslado;
  }

  guardar(): void {
    const origen = this.bodegaOrigenId();
    const destino = this.bodegaDestinoId();
    if (!this.puedeGuardar() || !origen || !destino) {
      this.formError.set('Selecciona origen, destino y cantidades de traslado mayores a 0.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.inventario
      .crearTraslado({
        id_bodega_origen: origen,
        id_bodega_destino: destino,
        items: this.seleccionados().map((item) => ({
          id_producto: item.id_producto,
          cantidad_traslado: item.cantidad_traslado,
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.pagina.set(1);
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(apiErrorMessage(err, 'No se pudo guardar el traslado.'));
        },
      });
  }

  verTiquete(item: TrasladoInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    this.tiquete.set(item);
  }

  imprimir(): void {
    window.print();
  }

  descargarExcel(item: TrasladoInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    this.inventario.descargarTrasladoExcel(item.id).subscribe({
      next: (blob) => {
        const file = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `traslado-${item.id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.errorMessage.set(apiErrorMessage(err, 'No se pudo descargar el Excel.'));
      },
    });
  }

  anular(item: TrasladoInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    if (item.estado === 'anulado') {
      return;
    }
    if (!window.confirm(`¿Anular el traslado #${item.id}? Se devolverá la mercancía a la bodega de origen.`)) {
      return;
    }
    this.inventario.anularTraslado(item.id).subscribe({
      error: (err) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo anular el traslado.')),
    });
  }

  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.menuId.update((current) => (current === id ? null : id));
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  irPagina(n: PageToken): void {
    if (n === 'gap') {
      return;
    }
    this.pagina.set(clampPage(n, this.filtrados().length, this.pageSize()));
  }

  setBusquedaProducto(value: string): void {
    this.busquedaProducto.set(value);
    this.paginaProducto.set(1);
  }

  setPageSizeProducto(value: string): void {
    this.pageSizeProducto.set(Number(value) || 10);
    this.paginaProducto.set(1);
  }

  irPaginaProducto(n: PageToken): void {
    if (n === 'gap') {
      return;
    }
    this.paginaProducto.set(clampPage(n, this.catalogoFiltrado().length, this.pageSizeProducto()));
  }

  formatoFecha(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(hours)}:${pad(date.getMinutes())} ${ampm}`;
  }

  formatoFechaCorta(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  }

  formatoCantidad(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  private cargarCatalogo(idBodega: number): void {
    this.loadingCatalogo.set(true);
    this.inventario.listarExistencias(idBodega).subscribe({
      next: (rows) => {
        this.catalogo.set(rows);
        this.loadingCatalogo.set(false);
      },
      error: (err) => {
        this.loadingCatalogo.set(false);
        this.formError.set(apiErrorMessage(err, 'No se pudieron cargar los productos de la bodega.'));
      },
    });
  }
}
