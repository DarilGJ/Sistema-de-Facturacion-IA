import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { KardexMovimiento } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { compactPages, PageToken } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const PROCESOS = [
  { id: '', label: 'Todos' },
  { id: 'entrada_compra', label: 'Entrada (compra/ingreso)' },
  { id: 'salida_venta', label: 'Salida (venta)' },
  { id: 'entrada_ajuste', label: 'Ajuste +' },
  { id: 'salida_ajuste', label: 'Ajuste -' },
  { id: 'entrada_devolucion', label: 'Devolución (entrada)' },
  { id: 'salida_devolucion', label: 'Devolución (salida)' },
];

const PROCESO_ETIQUETAS: Record<string, string> = {
  entrada_compra: 'Entrada (compra/ingreso)',
  salida_venta: 'Salida (venta)',
  entrada_ajuste: 'Ajuste +',
  salida_ajuste: 'Ajuste -',
  entrada_devolucion: 'Devolución (entrada)',
  salida_devolucion: 'Devolución (salida)',
  salida_traslado: 'Salida (traslado)',
  entrada_traslado: 'Entrada (traslado)',
  entrada_traslado_anular: 'Entrada (anulación traslado)',
  salida_traslado_anular: 'Salida (anulación traslado)',
  entrada_asignacion: 'Entrada (asignación)',
};

const DOCUMENTOS = [
  { id: '', label: 'Todos' },
  { id: 'factura', label: 'Factura' },
  { id: 'tiquete', label: 'Tiquete' },
  { id: 'factura_export', label: 'Factura Export.' },
  { id: 'compra_dc', label: 'Compra (DC)' },
  { id: 'egreso', label: 'Egreso' },
  { id: 'nota_credito', label: 'Nota Crédito' },
  { id: 'anulacion_fe', label: 'Anulación FE' },
  { id: 'anulacion_tq', label: 'Anulación TQ' },
  { id: 'ajuste', label: 'Ajuste' },
  { id: 'traslado', label: 'Traslado' },
  { id: 'asignacion', label: 'Asignación a bodega' },
  { id: 'devolucion', label: 'Devolución' },
];

@Component({
  selector: 'app-movimientos',
  imports: [InventarioNav, DatePipe, DecimalPipe, UiIcon],
  templateUrl: './movimientos.html',
  styleUrls: ['./inventario-shared.css', './categorias.css', './movimientos.css'],
})
export class Movimientos implements OnInit, OnDestroy {
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly procesos = PROCESOS;
  readonly documentos = DOCUMENTOS;
  readonly busqueda = signal('');
  readonly proceso = signal('');
  readonly documentoOrigen = signal('');
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(20);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly filas = signal<KardexMovimiento[]>([]);
  readonly total = signal(0);

  readonly paginas = computed(() => compactPages(this.pagina(), this.total(), this.pageSize()));
  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(Math.max(this.total(), 0) / this.pageSize())));
  readonly rango = computed(() => {
    if (!this.total()) {
      return { from: 0, to: 0 };
    }
    const from = (this.pagina() - 1) * this.pageSize() + 1;
    return { from, to: Math.min(this.pagina() * this.pageSize(), this.total()) };
  });

  constructor(readonly inventario: InventarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventario
      .listarKardex({
        q: this.busqueda(),
        proceso: this.proceso(),
        documento_origen: this.documentoOrigen(),
        desde: this.desde(),
        hasta: this.hasta(),
        page: this.pagina(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (page) => {
          this.filas.set(page.rows);
          this.total.set(page.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo cargar la bitácora.'));
        },
      });
  }

  limpiar(): void {
    this.busqueda.set('');
    this.proceso.set('');
    this.documentoOrigen.set('');
    this.desde.set('');
    this.hasta.set('');
    this.pagina.set(1);
    this.cargar();
  }

  setFiltro(campo: 'proceso' | 'documentoOrigen' | 'desde' | 'hasta' | 'busqueda', value: string): void {
    if (campo === 'proceso') this.proceso.set(value);
    if (campo === 'documentoOrigen') this.documentoOrigen.set(value);
    if (campo === 'desde') this.desde.set(value);
    if (campo === 'hasta') this.hasta.set(value);
    this.pagina.set(1);
    if (campo === 'busqueda') {
      this.busqueda.set(value);
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(() => this.cargar(), 300);
      return;
    }
    this.cargar();
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 20);
    this.pagina.set(1);
    this.cargar();
  }

  irPagina(n: PageToken): void {
    if (n === 'gap') {
      return;
    }
    this.pagina.set(Math.min(Math.max(n, 1), this.totalPaginas()));
    this.cargar();
  }

  etiquetaModulo(modulo: string): string {
    if (modulo === 'ventas') return 'Ventas';
    return 'Inventario';
  }

  etiquetaProceso(proceso: string): string {
    return PROCESO_ETIQUETAS[proceso] || proceso;
  }

  esSalida(cantidad: number): boolean {
    return Number(cantidad) < 0;
  }
}
