import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturaService } from '../../core/services/factura.service';
import { AuthService } from '../../core/services/auth.service';
import { Factura } from '../../core/models/factura.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice } from '../../core/utils/paginate';
import {
  abrirHtml,
  buildFacturaPosHtml,
  condicionLabel,
} from '../../core/utils/factura-print';
import { abrirFacturaPdf } from '../../core/utils/factura-pdf';
import { money } from '../../core/utils/money-letras';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu, RowMenuItem } from '../../shared/row-menu/row-menu';

export type ComprobanteModo = 'factura' | 'nc' | 'nd' | 'anulacion';

const ACCIONES_FACTURA: RowMenuItem[] = [
  { id: 'reutilizar', label: 'Reutilizar', icon: 'copy', accent: true },
  { id: 'pdf', label: 'Ver PDF', icon: 'pdf' },
  { id: 'pos', label: 'Impresión POS', icon: 'ticket' },
  { id: 'correo', label: 'Enviar correo', icon: 'mail' },
  { id: 'archivar', label: 'Archivar', icon: 'archive' },
  { id: 'anular', label: 'Nota de anulación', icon: 'warn' },
];

@Component({
  selector: 'app-listado-comprobantes',
  imports: [DecimalPipe, DatePipe, UiIcon, RowMenu],
  templateUrl: './listado-comprobantes.html',
  styleUrls: ['../inventario/inventario-shared.css', './listado-comprobantes.css'],
})
export class ListadoComprobantes implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facturasApi = inject(FacturaService);
  readonly auth = inject(AuthService);

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
  readonly acciones = ACCIONES_FACTURA;

  readonly origen = computed(() => {
    const modo = this.modo();
    const rows = this.facturasApi.facturas();
    if (modo === 'anulacion') {
      return rows.filter((f) => f.estado === 'anulada');
    }
    if (modo === 'nc' || modo === 'nd') {
      return [] as Factura[];
    }
    return this.archivado() ? rows.filter((f) => !!f.archivado) : rows.filter((f) => !f.archivado);
  });

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const metodo = this.filtroMetodo();
    const estado = this.filtroEstado();
    const tributacion = this.filtroTributacion();
    const tipo = this.filtroTipo();
    return this.origen().filter((f) => {
      const matchQ =
        !q ||
        f.numero.toLowerCase().includes(q) ||
        String(f.id).includes(q) ||
        (f.cliente?.nombre || '').toLowerCase().includes(q);
      const matchMetodo = !metodo || (f.condicion_venta || 'contado') === metodo;
      const matchEstado = !estado || this.estadoFiltro(f) === estado;
      const matchTrib = !tributacion || (f.tributacion || 'desconocido') === tributacion;
      const matchTipo = !tipo || (f.tipo_factura || 'factura') === tipo;
      return matchQ && matchMetodo && matchEstado && matchTrib && matchTipo;
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
    void this.router.navigate(['/comprobantes/facturas', item.id]);
  }

  onAccion(item: Factura, accion: string): void {
    if (accion === 'reutilizar') {
      void this.router.navigate(['/comprobantes/facturas/crear'], { queryParams: { reutilizar: item.id } });
      return;
    }
    if (accion === 'pdf') {
      this.conDocumento(item, (doc) => abrirFacturaPdf(doc, this.emisor()));
      return;
    }
    if (accion === 'pos') {
      this.conDocumento(item, (doc) =>
        abrirHtml(buildFacturaPosHtml(doc, this.emisor()), { print: true, width: 420, height: 900 })
      );
      return;
    }
    if (accion === 'correo') {
      this.facturasApi.actualizar(item.id, { correo_estado: 'enviado' }).subscribe({
        error: (err) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo marcar el correo.')),
      });
      const email = item.cliente?.email;
      if (email) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Factura #${item.id}`)}`;
      }
      return;
    }
    if (accion === 'archivar') {
      this.facturasApi.actualizar(item.id, { archivado: true }).subscribe({
        error: (err) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo archivar.')),
      });
      return;
    }
    if (accion === 'anular') {
      if (!confirm(`¿Registrar nota de anulación para la factura #${item.id}?`)) {
        return;
      }
      this.facturasApi.actualizar(item.id, { estado: 'anulada' }).subscribe({
        error: (err) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo anular.')),
      });
    }
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

  metodoLabel(item: Factura): string {
    return condicionLabel(item.condicion_venta);
  }

  estadoFiltro(item: Factura): 'cancelada' | 'pendiente' | 'anulada' {
    if (item.estado === 'anulada') {
      return 'anulada';
    }
    if (item.estado === 'pendiente') {
      return 'pendiente';
    }
    return 'cancelada';
  }

  estadoLabel(item: Factura): string {
    const estado = this.estadoFiltro(item);
    if (estado === 'anulada') {
      return 'Anulada';
    }
    if (estado === 'pendiente') {
      return 'Pendiente';
    }
    return 'Cancelada';
  }

  tributacionLabel(item: Factura): string {
    const t = item.tributacion || 'desconocido';
    if (t === 'no_entregado') {
      return 'No entregado';
    }
    if (t === 'aceptadas') {
      return 'Aceptadas';
    }
    if (t === 'rechazadas') {
      return 'Rechazadas';
    }
    return 'Desconocido';
  }

  correoLabel(item: Factura): string {
    return item.correo_estado === 'enviado' ? 'enviado' : 'No Entregado';
  }

  saldo(item: Factura): number {
    return this.estadoFiltro(item) === 'pendiente' ? money(item.total) : 0;
  }

  private conDocumento(item: Factura, fn: (doc: Factura) => void): void {
    if (item.items?.length) {
      fn(item);
      return;
    }
    this.facturasApi.obtener(item.id).subscribe({
      next: (doc) => fn(doc),
      error: (err) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo abrir el documento.')),
    });
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

  private aplicarRuta(): void {
    const data = this.route.snapshot.data;
    this.titulo.set(data['titulo'] || 'Listado de Facturas');
    this.subtitulo.set(data['subtitulo'] || 'Consulta, filtra y gestiona tus documentos.');
    this.modo.set((data['modo'] || 'factura') as ComprobanteModo);
    this.pagina.set(1);
  }
}
