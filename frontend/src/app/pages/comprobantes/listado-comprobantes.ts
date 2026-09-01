import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FacturaService } from '../../core/services/factura.service';
import { Factura } from '../../core/models/factura.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

export type ComprobanteModo = 'factura' | 'nc' | 'nd' | 'anulacion';

@Component({
  selector: 'app-listado-comprobantes',
  imports: [CurrencyPipe, DatePipe, UiIcon],
  templateUrl: './listado-comprobantes.html',
  styleUrl: '../inventario/inventario-shared.css',
})
export class ListadoComprobantes implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly facturasApi = inject(FacturaService);

  readonly titulo = signal('Listado de Facturas');
  readonly subtitulo = signal('Consulta, filtra y gestiona tus documentos.');
  readonly modo = signal<ComprobanteModo>('factura');
  readonly busqueda = signal('');
  readonly filtroMetodo = signal('');
  readonly filtroEstado = signal('');
  readonly filtroTributacion = signal('');
  readonly filtroTipo = signal('');
  readonly archivado = signal(false);
  readonly pageSize = signal(10);
  readonly pagina = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly detalle = signal<Factura | null>(null);

  readonly origen = computed(() => {
    const modo = this.modo();
    const rows = this.facturasApi.facturas();
    if (modo === 'anulacion') {
      return rows.filter((f) => f.estado === 'anulada');
    }
    if (modo === 'nc' || modo === 'nd') {
      return [] as Factura[];
    }
    return this.archivado() ? rows.filter((f) => f.estado === 'anulada') : rows;
  });

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const metodo = this.filtroMetodo();
    const estado = this.filtroEstado();
    const tipo = this.filtroTipo();
    return this.origen().filter((f) => {
      const matchQ =
        !q ||
        f.numero.toLowerCase().includes(q) ||
        String(f.id).includes(q) ||
        (f.cliente?.nombre || '').toLowerCase().includes(q);
      const matchMetodo = !metodo || f.metodo_pago === metodo;
      const matchEstado = !estado || f.estado === estado;
      const matchTipo = !tipo || tipo === 'factura';
      return matchQ && matchMetodo && matchEstado && matchTipo;
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length, this.pageSize()));

  ngOnInit(): void {
    this.aplicarRuta();
    this.route.data.subscribe(() => this.aplicarRuta());
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.facturasApi.listar().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los comprobantes.'));
      },
    });
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  setFiltro(campo: 'metodo' | 'estado' | 'tributacion' | 'tipo', value: string): void {
    if (campo === 'metodo') {
      this.filtroMetodo.set(value);
    }
    if (campo === 'estado') {
      this.filtroEstado.set(value);
    }
    if (campo === 'tributacion') {
      this.filtroTributacion.set(value);
    }
    if (campo === 'tipo') {
      this.filtroTipo.set(value);
    }
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  toggleArchivado(): void {
    this.archivado.update((value) => !value);
    this.pagina.set(1);
  }

  ver(item: Factura): void {
    this.detalle.set(item);
  }

  iniciales(nombre: string): string {
    return (nombre || 'CF')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  metodoLabel(metodo: Factura['metodo_pago']): string {
    if (metodo === 'efectivo') {
      return 'Contado';
    }
    if (metodo === 'tarjeta') {
      return 'Tarjeta';
    }
    return 'Transferencia';
  }

  estadoLabel(estado: Factura['estado']): string {
    return estado === 'anulada' ? 'Anulada' : 'Emitida';
  }

  correoLabel(item: Factura): string {
    return item.cliente?.email ? 'enviado' : 'No Entregado';
  }

  private aplicarRuta(): void {
    const data = this.route.snapshot.data;
    this.titulo.set(data['titulo'] || 'Listado de Facturas');
    this.subtitulo.set(data['subtitulo'] || 'Consulta, filtra y gestiona tus documentos.');
    this.modo.set((data['modo'] || 'factura') as ComprobanteModo);
    this.detalle.set(null);
    this.pagina.set(1);
  }
}
