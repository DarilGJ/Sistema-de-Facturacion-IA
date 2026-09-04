import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { AuthService } from '../../core/services/auth.service';
import { Cotizacion } from '../../core/models/cotizacion.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice } from '../../core/utils/paginate';
import { money } from '../../core/utils/money-letras';
import { abrirHtml, buildFacturaPosHtml } from '../../core/utils/factura-print';
import { abrirFacturaPdf } from '../../core/utils/factura-pdf';
import { cotizacionComoFactura } from '../../core/utils/cotizacion-print';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu, RowMenuItem } from '../../shared/row-menu/row-menu';

@Component({
  selector: 'app-listado-cotizaciones',
  imports: [DecimalPipe, DatePipe, UiIcon, RowMenu],
  templateUrl: './listado-cotizaciones.html',
  styleUrls: ['../inventario/inventario-shared.css', './listado-cotizaciones.css'],
})
export class ListadoCotizaciones implements OnInit {
  readonly api = inject(CotizacionService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busqueda = signal('');
  readonly filtroMetodo = signal('');
  readonly filtroEstado = signal('');
  readonly archivado = signal(false);
  readonly pageSize = signal(10);
  readonly pagina = signal(1);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly generando = signal(false);
  readonly modal = signal<Cotizacion | null>(null);
  readonly fechaEmision = signal('');

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
  readonly paginas = computed(() => compactPages(this.pagina(), this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length, this.pageSize()));
  readonly ultimaPagina = computed(() =>
    Math.max(1, Math.ceil(Math.max(this.filtrados().length, 0) / this.pageSize()) || 1)
  );

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

  acciones(item: Cotizacion): RowMenuItem[] {
    const puedeEditar = item.estado === 'pendiente' && !item.generada;
    const items: RowMenuItem[] = [];
    if (puedeEditar) {
      items.push({ id: 'editar', label: 'Editar', icon: 'pencil' });
    }
    items.push({ id: 'reutilizar', label: 'Reutilizar', icon: 'copy', accent: true });
    if (puedeEditar) {
      items.push({ id: 'generar', label: 'Generar Factura/Ticket', icon: 'document' });
    }
    items.push(
      { id: 'pdf', label: 'Ver PDF', icon: 'pdf' },
      { id: 'pos', label: 'Impresión POS', icon: 'ticket' },
      { id: 'correo', label: 'Enviar correo', icon: 'mail' }
    );
    if (item.estado !== 'archivada') {
      items.push({ id: 'archivar', label: 'Archivar', icon: 'archive' });
    }
    if (item.estado !== 'anulada' && item.estado !== 'archivada') {
      items.push({ id: 'anular', label: 'Anulación Local', icon: 'warn' });
    }
    return items;
  }

  onAccion(item: Cotizacion, accion: string): void {
    if (accion === 'editar') {
      void this.router.navigate(['/cotizaciones/crear'], { queryParams: { editar: item.id } });
      return;
    }
    if (accion === 'reutilizar') {
      void this.router.navigate(['/cotizaciones/crear'], { queryParams: { reutilizar: item.id } });
      return;
    }
    if (accion === 'generar') {
      this.abrirGenerar(item);
      return;
    }
    if (accion === 'pdf') {
      this.conDocumento(item, (doc) =>
        abrirFacturaPdf(cotizacionComoFactura(doc), this.emisor(), {
          titulo: 'Cotización',
          encabezado: 'COTIZACION',
          pie: 'Representacion impresa de la Cotizacion',
          filename: `Cotizacion-${String(doc.id).padStart(10, '0')}.pdf`,
        })
      );
      return;
    }
    if (accion === 'pos') {
      this.conDocumento(item, (doc) =>
        abrirHtml(buildFacturaPosHtml(cotizacionComoFactura(doc), this.emisor()), {
          print: true,
          width: 420,
          height: 900,
        })
      );
      return;
    }
    if (accion === 'correo') {
      const email = item.cliente?.email;
      if (email) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Cotización #${item.id}`)}`;
      } else {
        this.errorMessage.set('El receptor no tiene correo registrado.');
      }
      return;
    }
    if (accion === 'archivar') {
      this.api.actualizar(item.id, { estado: 'archivada' }).subscribe({
        error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo archivar.')),
      });
      return;
    }
    if (accion === 'anular') {
      if (!confirm(`¿Registrar anulación local de la cotización #${item.id}?`)) {
        return;
      }
      this.api.actualizar(item.id, { estado: 'anulada' }).subscribe({
        error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo anular.')),
      });
    }
  }

  abrirGenerar(item: Cotizacion): void {
    if (item.generada || item.estado !== 'pendiente') {
      this.errorMessage.set('Esta cotización no se puede generar.');
      return;
    }
    this.errorMessage.set('');
    this.fechaEmision.set(this.hoyInput());
    this.conDocumento(item, (doc) => this.modal.set(doc));
  }

  cerrarModal(): void {
    this.modal.set(null);
    this.generando.set(false);
  }

  editarDesdeModal(item: Cotizacion): void {
    this.cerrarModal();
    void this.router.navigate(['/cotizaciones/crear'], { queryParams: { editar: item.id } });
  }

  generar(tipo: 'factura' | 'recibo'): void {
    const item = this.modal();
    if (!item) {
      return;
    }
    this.generando.set(true);
    this.errorMessage.set('');
    this.api
      .convertirAFactura(item.id, {
        tipo_factura: tipo,
        fecha: this.fechaEmision() || undefined,
      })
      .subscribe({
        next: () => {
          this.generando.set(false);
          this.cerrarModal();
        },
        error: (err: unknown) => {
          this.generando.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo generar el comprobante.'));
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

  formaPagoLabel(item: Cotizacion): string {
    return item.metodo_pago === 'credito' ? 'Crédito' : 'Efectivo';
  }

  estadoLabel(estado: Cotizacion['estado']): string {
    if (estado === 'cancelada') {
      return 'Cancelada';
    }
    if (estado === 'anulada') {
      return 'Anulada';
    }
    if (estado === 'archivada') {
      return 'Archivada';
    }
    return 'Pendiente';
  }

  saldo(item: Cotizacion): number {
    if (item.metodo_pago === 'credito' && item.estado === 'pendiente') {
      return money(item.total);
    }
    return 0;
  }

  totalLineas(item: Cotizacion): number {
    return (item.items || []).reduce((acc, linea) => acc + money(linea.subtotal), 0);
  }

  private conDocumento(item: Cotizacion, fn: (doc: Cotizacion) => void): void {
    if (item.items?.length) {
      fn(item);
      return;
    }
    this.api.obtener(item.id).subscribe({
      next: (doc) => fn(doc),
      error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo abrir el documento.')),
    });
  }

  private hoyInput(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private emisor() {
    const user = this.auth.user();
    return {
      nombre: user?.nombre || 'FacturaAI',
      razonSocial: 'FacturaAI',
      nit: 'N/D',
      telefono: 'N/D',
      email: user?.email || 'N/D',
      direccion: 'Guatemala',
    };
  }
}
