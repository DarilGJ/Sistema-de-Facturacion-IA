import { DecimalPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CompraService } from '../../core/services/compra.service';
import { AuthService } from '../../core/services/auth.service';
import { Compra } from '../../core/models/compra.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice } from '../../core/utils/paginate';
import { money } from '../../core/utils/money-letras';
import { abrirHtml, buildFacturaPosHtml } from '../../core/utils/factura-print';
import { abrirFacturaPdf } from '../../core/utils/factura-pdf';
import { compraComoFactura, nombreProveedorCompra } from '../../core/utils/compra-print';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu, RowMenuItem } from '../../shared/row-menu/row-menu';

const ACCIONES: RowMenuItem[] = [
  { id: 'reutilizar', label: 'Reutilizar', icon: 'copy', accent: true },
  { id: 'pdf', label: 'Ver PDF', icon: 'pdf' },
  { id: 'pos', label: 'Impresión POS', icon: 'ticket' },
  { id: 'correo', label: 'Enviar correo', icon: 'mail' },
  { id: 'archivar', label: 'Archivar', icon: 'archive' },
  { id: 'anular', label: 'Anulación Local', icon: 'warn' },
];

@Component({
  selector: 'app-listado-compras',
  imports: [DecimalPipe, DatePipe, UiIcon, RowMenu],
  templateUrl: './listado-compras.html',
  styleUrls: ['../inventario/inventario-shared.css', '../comprobantes/listado-comprobantes.css', './listado-compras.css'],
})
export class ListadoCompras implements OnInit {
  readonly api = inject(CompraService);
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
  readonly acciones = ACCIONES;

  readonly origen = computed(() => {
    const rows = this.api.compras();
    return this.archivado() ? rows.filter((row) => !!row.archivado) : rows.filter((row) => !row.archivado);
  });

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const metodo = this.filtroMetodo();
    const estado = this.filtroEstado();
    return this.origen().filter((row) => {
      const nombre = nombreProveedorCompra(row).toLowerCase();
      const matchQ =
        !q ||
        row.numero.toLowerCase().includes(q) ||
        String(row.id).includes(q) ||
        (row.numero_proveedor || '').toLowerCase().includes(q) ||
        nombre.includes(q);
      const matchMetodo = !metodo || row.condicion_venta === metodo;
      const matchEstado = !estado || this.estadoFiltro(row) === estado;
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
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar las compras.'));
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

  onAccion(item: Compra, accion: string): void {
    if (accion === 'reutilizar') {
      void this.router.navigate(['/egresos/compras/crear'], { queryParams: { reutilizar: item.id } });
      return;
    }
    if (accion === 'pdf') {
      this.conDocumento(item, (doc) =>
        abrirFacturaPdf(compraComoFactura(doc), this.emisor(), {
          titulo: 'Compra',
          encabezado: 'COMPRA',
          pie: 'Representacion impresa de la Compra',
          filename: `Compra-${String(doc.id).padStart(10, '0')}.pdf`,
        })
      );
      return;
    }
    if (accion === 'pos') {
      this.conDocumento(item, (doc) =>
        abrirHtml(buildFacturaPosHtml(compraComoFactura(doc), this.emisor()), {
          print: true,
          width: 420,
          height: 900,
        })
      );
      return;
    }
    if (accion === 'correo') {
      const email = item.proveedor?.email;
      if (email) {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Compra #${item.id}`)}`;
      } else {
        this.errorMessage.set('El proveedor no tiene correo registrado.');
      }
      return;
    }
    if (accion === 'archivar') {
      this.api.actualizar(item.id, { archivado: true }).subscribe({
        error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo archivar.')),
      });
      return;
    }
    if (accion === 'anular') {
      if (this.estadoFiltro(item) === 'anulada') {
        return;
      }
      if (!confirm(`¿Registrar anulación local de la compra #${item.id}? Se revertirá el inventario.`)) {
        return;
      }
      this.api.actualizar(item.id, { estado: 'anulada' }).subscribe({
        error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo anular.')),
      });
    }
  }

  accionesFila(item: Compra): RowMenuItem[] {
    return this.acciones.filter((accion) => {
      if (accion.id === 'archivar') {
        return !item.archivado;
      }
      if (accion.id === 'anular') {
        return this.estadoFiltro(item) !== 'anulada';
      }
      return true;
    });
  }

  iniciales(nombre: string): string {
    return (nombre || 'PR')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  receptor(item: Compra): string {
    return nombreProveedorCompra(item);
  }

  metodoLabel(item: Compra): string {
    return item.condicion_venta === 'credito' ? 'Crédito' : 'Contado';
  }

  estadoFiltro(item: Compra): 'pendiente' | 'cancelada' | 'anulada' {
    if (item.estado === 'anulada') {
      return 'anulada';
    }
    if (item.estado === 'pendiente' || (item.estado === 'registrada' && item.condicion_venta === 'credito')) {
      return 'pendiente';
    }
    return 'cancelada';
  }

  estadoLabel(item: Compra): string {
    const estado = this.estadoFiltro(item);
    if (estado === 'anulada') {
      return 'Anulada';
    }
    if (estado === 'pendiente') {
      return 'Pendiente';
    }
    return 'Cancelada';
  }

  saldo(item: Compra): number {
    return this.estadoFiltro(item) === 'pendiente' ? money(item.total) : 0;
  }

  private conDocumento(item: Compra, fn: (doc: Compra) => void): void {
    if (item.items?.length) {
      fn(item);
      return;
    }
    this.api.obtener(item.id).subscribe({
      next: (doc) => fn(doc),
      error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo abrir el documento.')),
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
}
