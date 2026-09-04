import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { AjusteInventario, Existencia, TipoAjuste } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice, PageToken } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

interface LineaAjuste {
  id_bodega: number;
  bodega: string;
  id_producto: number;
  sku: string;
  producto: string;
  cantidad_actual: number;
  tipo: TipoAjuste;
  cantidad_ajuste: number;
}

@Component({
  selector: 'app-ajustes',
  imports: [InventarioNav, UiIcon],
  templateUrl: './ajustes.html',
  styleUrls: ['./inventario-shared.css', './categorias.css', './ajustes.css'],
})
export class AjustesCantidad implements OnInit {
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly formOpen = signal(false);
  readonly detalle = signal<AjusteInventario | null>(null);
  readonly menuId = signal<number | null>(null);

  readonly bodegaId = signal<number | null>(null);
  readonly catalogo = signal<Existencia[]>([]);
  readonly loadingCatalogo = signal(false);
  readonly busquedaProducto = signal('');
  readonly paginaProducto = signal(1);
  readonly pageSizeProducto = signal(10);
  readonly seleccionados = signal<LineaAjuste[]>([]);
  readonly descripcion = signal('');
  readonly formError = signal('');

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.inventario.ajustes().filter((item) => {
      if (!q) {
        return true;
      }
      const numero = `#${item.id}`;
      const productos = item.items.map((linea) => linea.producto).join(' ');
      return (
        numero.includes(q) ||
        String(item.id).includes(q) ||
        (item.descripcion || '').toLowerCase().includes(q) ||
        productos.toLowerCase().includes(q)
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
    const tomados = new Set(this.seleccionados().map((item) => `${item.id_bodega}:${item.id_producto}`));
    return this.catalogo().filter((item) => {
      if (tomados.has(`${item.id_bodega}:${item.id_producto}`)) {
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

  readonly bodegaActual = computed(
    () => this.inventario.almacenes().find((item) => item.id === this.bodegaId()) || null
  );

  readonly puedeGuardar = computed(
    () =>
      this.seleccionados().length > 0 &&
      this.seleccionados().every((item) => item.cantidad_ajuste > 0) &&
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
    if (this.detalle()) {
      this.detalle.set(null);
      return;
    }
    if (this.formOpen()) {
      this.cancelar();
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventario.listarAjustes().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los ajustes.'));
      },
    });
  }

  abrirNuevo(): void {
    this.formError.set('');
    this.bodegaId.set(null);
    this.catalogo.set([]);
    this.seleccionados.set([]);
    this.descripcion.set('');
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

  seleccionarBodega(value: string): void {
    const id = Number(value) || null;
    this.bodegaId.set(id);
    this.catalogo.set([]);
    this.busquedaProducto.set('');
    this.paginaProducto.set(1);
    this.formError.set('');
    if (!id) {
      return;
    }
    this.cargarCatalogo(id);
  }

  recargarCatalogo(): void {
    const id = this.bodegaId();
    if (!id) {
      return;
    }
    this.cargarCatalogo(id);
  }

  agregar(item: Existencia): void {
    if (this.seleccionados().some((row) => row.id_bodega === item.id_bodega && row.id_producto === item.id_producto)) {
      return;
    }
    const bodega =
      this.inventario.almacenes().find((row) => row.id === item.id_bodega)?.nombre ||
      this.bodegaActual()?.nombre ||
      '';
    this.seleccionados.update((lista) => [
      ...lista,
      {
        id_bodega: item.id_bodega,
        bodega,
        id_producto: item.id_producto,
        sku: item.sku,
        producto: item.nombre,
        cantidad_actual: item.cantidad,
        tipo: 'mas',
        cantidad_ajuste: 0,
      },
    ]);
  }

  quitar(item: LineaAjuste): void {
    this.seleccionados.update((lista) =>
      lista.filter((row) => !(row.id_bodega === item.id_bodega && row.id_producto === item.id_producto))
    );
  }

  setTipo(item: LineaAjuste, tipo: TipoAjuste): void {
    this.patchLinea(item, { tipo, cantidad_ajuste: this.clampAjuste({ ...item, tipo }, item.cantidad_ajuste) });
  }

  setCantidadAjuste(item: LineaAjuste, value: string): void {
    const n = Math.max(0, Math.trunc(Number(value) || 0));
    this.patchLinea(item, { cantidad_ajuste: this.clampAjuste(item, n) });
  }

  cantidadFinal(item: LineaAjuste): number {
    return item.tipo === 'mas'
      ? item.cantidad_actual + item.cantidad_ajuste
      : item.cantidad_actual - item.cantidad_ajuste;
  }

  guardar(): void {
    if (!this.puedeGuardar()) {
      this.formError.set('Selecciona productos y una cantidad de ajuste mayor a 0.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.inventario
      .crearAjuste({
        descripcion: this.descripcion().trim() || null,
        items: this.seleccionados().map((item) => ({
          id_bodega: item.id_bodega,
          id_producto: item.id_producto,
          tipo: item.tipo,
          cantidad_ajuste: item.cantidad_ajuste,
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
          this.formError.set(apiErrorMessage(err, 'No se pudo guardar el ajuste.'));
        },
      });
  }

  ver(item: AjusteInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    this.detalle.set(item);
  }

  descargarExcel(item: AjusteInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    this.inventario.descargarAjusteExcel(item.id).subscribe({
      next: (blob) => {
        const file = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ajuste-${item.id}.xlsx`;
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

  formatoCantidad(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  trackLinea(item: LineaAjuste): string {
    return `${item.id_bodega}:${item.id_producto}`;
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

  private clampAjuste(item: LineaAjuste, cantidad: number): number {
    if (item.tipo === 'menos') {
      return Math.min(cantidad, item.cantidad_actual);
    }
    return cantidad;
  }

  private patchLinea(item: LineaAjuste, patch: Partial<LineaAjuste>): void {
    this.seleccionados.update((lista) =>
      lista.map((row) =>
        row.id_bodega === item.id_bodega && row.id_producto === item.id_producto ? { ...row, ...patch } : row
      )
    );
  }
}
