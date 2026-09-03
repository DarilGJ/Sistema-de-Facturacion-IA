import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { Cotizacion } from '../../core/models/cotizacion.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

@Component({
  selector: 'app-listado-cotizaciones',
  imports: [CurrencyPipe, DatePipe, UiIcon, RowMenu],
  templateUrl: './listado-cotizaciones.html',
  styleUrl: '../inventario/inventario-shared.css',
})
export class ListadoCotizaciones implements OnInit {
  readonly api = inject(CotizacionService);
  private readonly router = inject(Router);
  readonly convirtiendo = signal<number | null>(null);

  readonly busqueda = signal('');
  readonly filtroMetodo = signal('');
  readonly filtroEstado = signal('');
  readonly archivado = signal(false);
  readonly pageSize = signal(10);
  readonly pagina = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly detalle = signal<Cotizacion | null>(null);

  readonly origen = computed(() => {
    const rows = this.api.cotizaciones();
    return this.archivado()
      ? rows.filter((row) => row.estado === 'archivada')
      : rows.filter((row) => row.estado !== 'archivada');
  });

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const metodo = this.filtroMetodo();
    const estado = this.filtroEstado();
    return this.origen().filter((row) => {
      const matchQ =
        !q ||
        row.numero.toLowerCase().includes(q) ||
        String(row.id).includes(q) ||
        (row.cliente?.nombre || '').toLowerCase().includes(q);
      const matchMetodo = !metodo || row.metodo_pago === metodo;
      const matchEstado = !estado || row.estado === estado;
      return matchQ && matchMetodo && matchEstado;
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length, this.pageSize()));

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.listar().subscribe({
      next: () => this.loading.set(false),
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar las cotizaciones.'));
      },
    });
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  setFiltro(campo: 'metodo' | 'estado', value: string): void {
    if (campo === 'metodo') {
      this.filtroMetodo.set(value);
    } else {
      this.filtroEstado.set(value);
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

  ver(item: Cotizacion): void {
    this.detalle.set(item);
  }

  archivar(item: Cotizacion): void {
    this.api.actualizar(item.id, { estado: 'archivada' }).subscribe({
      error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err)),
    });
  }

  convertir(item: Cotizacion): void {
    if (item.generada || item.estado !== 'pendiente') {
      this.errorMessage.set('Esta cotización no se puede convertir a factura.');
      return;
    }
    this.convirtiendo.set(item.id);
    this.errorMessage.set('');
    this.api.convertirAFactura(item.id).subscribe({
      next: (res) => {
        this.convirtiendo.set(null);
        void this.router.navigate(['/comprobantes/facturas']);
        this.detalle.set(null);
        if (res.factura) {
          this.errorMessage.set('');
        }
      },
      error: (err: unknown) => {
        this.convirtiendo.set(null);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudo convertir la cotización.'));
      },
    });
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

  metodoLabel(metodo: Cotizacion['metodo_pago']): string {
    return metodo === 'credito' ? 'Crédito' : 'Contado';
  }

  estadoLabel(estado: Cotizacion['estado']): string {
    if (estado === 'cancelada') {
      return 'Cancelada';
    }
    if (estado === 'archivada') {
      return 'Archivada';
    }
    return 'Pendiente';
  }

  saldo(item: Cotizacion): number {
    if (item.metodo_pago === 'credito' && item.estado === 'pendiente') {
      return Number(item.total);
    }
    return 0;
  }
}
