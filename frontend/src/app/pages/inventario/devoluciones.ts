import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { FacturaService } from '../../core/services/factura.service';
import {
  DevolucionFactura,
  DevolucionFacturaItem,
  DevolucionInventario,
  Existencia,
  RazonDevolucion,
  ResolucionDevolucion,
} from '../../core/models/inventario.model';
import { Factura } from '../../core/models/factura.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice, PageToken } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

interface LineaDevolucion extends DevolucionFacturaItem {
  cantidad_devolver: number;
  id_producto_cambio: number | null;
  cantidad_cambio: number;
  precio_cambio: number;
}

const RAZONES: Array<{ id: RazonDevolucion | ''; label: string }> = [
  { id: '', label: 'Todas' },
  { id: 'danado', label: 'Dañado' },
  { id: 'vencido', label: 'Vencido' },
  { id: 'no_gusto', label: 'No gustó' },
  { id: 'cambio_producto', label: 'Cambio producto' },
];

const RAZON_LABEL: Record<RazonDevolucion, string> = {
  danado: 'Dañado',
  vencido: 'Vencido',
  no_gusto: 'No gustó',
  cambio_producto: 'Cambio producto',
};

const RESOLUCION_LABEL: Record<ResolucionDevolucion, string> = {
  reembolso_efectivo: 'Reembolso efectivo',
  nota_credito: 'Nota de crédito',
  cambio: 'Cambio de producto',
};

const ITBIS = 0.18;

@Component({
  selector: 'app-devoluciones',
  imports: [InventarioNav, UiIcon],
  templateUrl: './devoluciones.html',
  styleUrls: ['./inventario-shared.css', './categorias.css', './ajustes.css', './traslados.css', './devoluciones.css'],
})
export class DevolucionesInventario implements OnInit {
  readonly razones = RAZONES;
  readonly razonFiltro = signal<RazonDevolucion | ''>('');
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly formOpen = signal(false);
  readonly detalle = signal<DevolucionInventario | null>(null);
  readonly menuId = signal<number | null>(null);

  readonly bodegaId = signal<number | null>(null);
  readonly razon = signal<RazonDevolucion>('no_gusto');
  readonly resolucion = signal<Exclude<ResolucionDevolucion, 'cambio'>>('reembolso_efectivo');
  readonly observacion = signal('');
  readonly formError = signal('');

  readonly busquedaFactura = signal('');
  readonly facturas = signal<Factura[]>([]);
  readonly factura = signal<DevolucionFactura | null>(null);
  readonly loadingFactura = signal(false);
  readonly lineas = signal<LineaDevolucion[]>([]);

  readonly catalogo = signal<Existencia[]>([]);
  readonly loadingCatalogo = signal(false);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const razon = this.razonFiltro();
    return this.inventario.devoluciones().filter((item) => {
      if (razon && item.razon !== razon) {
        return false;
      }
      if (!q) {
        return true;
      }
      const productos = item.items.map((linea) => `${linea.producto} ${linea.sku}`).join(' ');
      return (
        item.numero.toLowerCase().includes(q) ||
        item.referencia_nc.toLowerCase().includes(q) ||
        item.factura.toLowerCase().includes(q) ||
        item.cliente.toLowerCase().includes(q) ||
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

  readonly facturasFiltradas = computed(() => {
    const q = this.busquedaFactura().trim().toLowerCase();
    return this.facturas()
      .filter((item) => item.estado === 'emitida')
      .filter((item) => {
        if (!q) {
          return true;
        }
        return (
          item.numero.toLowerCase().includes(q) ||
          (item.cliente?.nombre || '').toLowerCase().includes(q) ||
          (item.cliente?.nit || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  });

  readonly esCambio = computed(() => this.razon() === 'cambio_producto');
  readonly restableceStock = computed(() => this.razon() === 'no_gusto' || this.razon() === 'cambio_producto');

  readonly resumen = computed(() => {
    const activas = this.lineas().filter((item) => item.cantidad_devolver > 0);
    const subtotal = round(activas.reduce((sum, item) => sum + item.cantidad_devolver * item.precio_unitario, 0));
    const itbis = round(subtotal * ITBIS);
    const total = round(subtotal + itbis);
    let subtotalCambio = 0;
    if (this.esCambio()) {
      subtotalCambio = round(
        activas.reduce((sum, item) => sum + item.cantidad_cambio * item.precio_cambio, 0)
      );
    }
    const itbisCambio = round(subtotalCambio * ITBIS);
    const totalCambio = round(subtotalCambio + itbisCambio);
    const diferencia = round(totalCambio - total);
    let reembolso = 0;
    let cobro = 0;
    let nota = 0;
    if (this.esCambio()) {
      if (diferencia > 0) cobro = diferencia;
      if (diferencia < 0) reembolso = round(-diferencia);
    } else if (this.resolucion() === 'reembolso_efectivo') {
      reembolso = total;
    } else {
      nota = total;
    }
    return { subtotal, itbis, total, subtotalCambio, itbisCambio, totalCambio, diferencia, reembolso, cobro, nota };
  });

  readonly puedeGuardar = computed(() => {
    if (this.saving() || !this.factura() || !this.bodegaId()) {
      return false;
    }
    const activas = this.lineas().filter((item) => item.cantidad_devolver > 0);
    if (!activas.length) {
      return false;
    }
    if (this.esCambio()) {
      return activas.every(
        (item) => item.id_producto_cambio && item.cantidad_cambio > 0 && item.precio_cambio >= 0
      );
    }
    return true;
  });

  constructor(
    readonly inventario: InventarioService,
    private readonly facturasApi: FacturaService
  ) {}

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
    this.inventario.listarDevoluciones().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar las devoluciones.'));
      },
    });
  }

  abrirNuevo(): void {
    this.formError.set('');
    this.bodegaId.set(this.inventario.almacenes().find((item) => item.principal && item.estado)?.id || null);
    this.razon.set('no_gusto');
    this.resolucion.set('reembolso_efectivo');
    this.observacion.set('');
    this.busquedaFactura.set('');
    this.factura.set(null);
    this.lineas.set([]);
    this.catalogo.set([]);
    this.formOpen.set(true);
    this.facturasApi.listar().subscribe({
      next: (rows) => this.facturas.set(rows),
      error: (err) => this.formError.set(apiErrorMessage(err, 'No se pudieron cargar las facturas.')),
    });
    if (this.bodegaId()) {
      this.cargarCatalogo(this.bodegaId()!);
    }
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
    if (id) {
      this.cargarCatalogo(id);
    }
  }

  setRazon(value: string): void {
    const razon = (value || 'no_gusto') as RazonDevolucion;
    this.razon.set(razon);
    if (razon === 'cambio_producto') {
      this.lineas.update((lista) =>
        lista.map((item) => ({
          ...item,
          cantidad_cambio: item.cantidad_cambio || item.cantidad_devolver || 1,
          precio_cambio: item.precio_cambio || item.precio_venta || item.precio_unitario,
        }))
      );
    }
  }

  setResolucion(value: string): void {
    this.resolucion.set(value === 'nota_credito' ? 'nota_credito' : 'reembolso_efectivo');
  }

  setBusquedaFactura(value: string): void {
    this.busquedaFactura.set(value);
  }

  elegirFactura(item: Factura): void {
    this.loadingFactura.set(true);
    this.formError.set('');
    this.inventario.facturaDevolucion(item.id).subscribe({
      next: (factura) => {
        this.factura.set(factura);
        this.lineas.set(
          factura.items.map((linea) => ({
            ...linea,
            cantidad_devolver: linea.cantidad_disponible > 0 ? 0 : 0,
            id_producto_cambio: null,
            cantidad_cambio: 0,
            precio_cambio: linea.precio_venta || linea.precio_unitario,
          }))
        );
        this.loadingFactura.set(false);
      },
      error: (err) => {
        this.loadingFactura.set(false);
        this.formError.set(apiErrorMessage(err, 'No se pudo cargar la factura.'));
      },
    });
  }

  setCantidad(item: LineaDevolucion, value: string): void {
    const n = Math.min(item.cantidad_disponible, Math.max(0, Math.trunc(Number(value) || 0)));
    this.patchLinea(item, {
      cantidad_devolver: n,
      cantidad_cambio: this.esCambio() ? n || item.cantidad_cambio : item.cantidad_cambio,
    });
  }

  setCantidadCambio(item: LineaDevolucion, value: string): void {
    const n = Math.max(0, Math.trunc(Number(value) || 0));
    this.patchLinea(item, { cantidad_cambio: n });
  }

  setPrecioCambio(item: LineaDevolucion, value: string): void {
    const n = Math.max(0, Number(value) || 0);
    this.patchLinea(item, { precio_cambio: round(n) });
  }

  setProductoCambio(item: LineaDevolucion, value: string): void {
    const id = Number(value) || null;
    this.patchLinea(item, {
      id_producto_cambio: id,
      cantidad_cambio: item.cantidad_cambio || item.cantidad_devolver || 1,
    });
  }

  guardar(): void {
    const factura = this.factura();
    const bodega = this.bodegaId();
    if (!this.puedeGuardar() || !factura || !bodega) {
      this.formError.set('Completa factura, bodega y cantidades a devolver.');
      return;
    }
    const items = this.lineas()
      .filter((item) => item.cantidad_devolver > 0)
      .map((item) => ({
        id_factura_item: item.id_factura_item,
        cantidad: item.cantidad_devolver,
        id_producto_cambio: this.esCambio() ? item.id_producto_cambio : null,
        cantidad_cambio: this.esCambio() ? item.cantidad_cambio : 0,
        precio_cambio: this.esCambio() ? item.precio_cambio : 0,
      }));
    this.saving.set(true);
    this.formError.set('');
    this.inventario
      .crearDevolucion({
        id_factura: factura.id,
        id_bodega: bodega,
        razon: this.razon(),
        resolucion: this.esCambio() ? 'cambio' : this.resolucion(),
        observacion: this.observacion().trim() || null,
        items,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.pagina.set(1);
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(apiErrorMessage(err, 'No se pudo procesar la devolución.'));
        },
      });
  }

  ver(item: DevolucionInventario, event?: Event): void {
    event?.stopPropagation();
    this.menuId.set(null);
    this.detalle.set(item);
  }

  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.menuId.update((current) => (current === id ? null : id));
  }

  setFiltroRazon(value: string): void {
    this.razonFiltro.set((value || '') as RazonDevolucion | '');
    this.pagina.set(1);
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

  etiquetaRazon(value: RazonDevolucion): string {
    return RAZON_LABEL[value] || value;
  }

  etiquetaResolucion(value: ResolucionDevolucion): string {
    return RESOLUCION_LABEL[value] || value;
  }

  productosResumen(item: DevolucionInventario): string {
    return item.items.map((linea) => linea.producto).join(', ') || '—';
  }

  cantidadTotal(item: DevolucionInventario): number {
    return item.items.reduce((sum, linea) => sum + Number(linea.cantidad || 0), 0);
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
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(hours)}:${pad(
      date.getMinutes()
    )} ${ampm}`;
  }

  moneda(value: number): string {
    return `RD$ ${Number(value || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatoCantidad(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  impactoInventario(item: DevolucionInventario): string {
    if (item.razon === 'danado' || item.razon === 'vencido') {
      return 'No reingresa a stock vendible (merma / no apto).';
    }
    if (item.razon === 'cambio_producto') {
      return 'Entra el producto devuelto y sale el producto entregado.';
    }
    return 'Reingresa a la bodega seleccionada.';
  }

  private patchLinea(item: LineaDevolucion, patch: Partial<LineaDevolucion>): void {
    this.lineas.update((lista) =>
      lista.map((row) => (row.id_factura_item === item.id_factura_item ? { ...row, ...patch } : row))
    );
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

function round(value: number): number {
  return Math.round(Number(value || 0) * 100) / 100;
}
