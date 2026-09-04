import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FacturaService } from '../../core/services/factura.service';
import { Factura } from '../../core/models/factura.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import {
  abrirHtml,
  buildFacturaDteHtml,
  buildFacturaPosHtml,
  condicionLabel,
  tipoFacturaLabel,
} from '../../core/utils/factura-print';
import { abrirFacturaPdf, descargarFacturaPdf } from '../../core/utils/factura-pdf';
import { padDoc } from '../../core/utils/money-letras';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

type AccordionKey = 'pagos' | 'nc' | 'nd';

@Component({
  selector: 'app-seguimiento-factura',
  imports: [RouterLink, UiIcon],
  templateUrl: './seguimiento-factura.html',
  styleUrls: ['../inventario/inventario-shared.css', './seguimiento-factura.css'],
})
export class SeguimientoFactura implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  readonly auth = inject(AuthService);
  readonly api = inject(FacturaService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly factura = signal<Factura | null>(null);
  readonly abierto = signal<AccordionKey | null>('pagos');
  readonly buscaPago = signal('');
  readonly buscaNc = signal('');
  readonly buscaNd = signal('');

  readonly html = computed<SafeHtml | ''>(() => {
    const doc = this.factura();
    if (!doc) {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustHtml(buildFacturaDteHtml(doc, this.emisor()));
  });

  readonly tituloDoc = computed(() => {
    const doc = this.factura();
    if (!doc) {
      return 'Factura';
    }
    return `${tipoFacturaLabel(doc.tipo_factura)} # ${padDoc(doc.id)}`;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      void this.router.navigate(['/comprobantes/facturas']);
      return;
    }
    this.api.obtener(id).subscribe({
      next: (doc) => {
        this.factura.set(doc);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudo cargar el comprobante.'));
      },
    });
  }

  toggle(key: AccordionKey): void {
    this.abierto.update((actual) => (actual === key ? null : key));
  }

  compartir(): void {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url);
    }
  }

  reutilizar(): void {
    const doc = this.factura();
    if (!doc) {
      return;
    }
    void this.router.navigate(['/comprobantes/facturas/crear'], { queryParams: { reutilizar: doc.id } });
  }

  descargarPdf(): void {
    const doc = this.factura();
    if (doc) {
      descargarFacturaPdf(doc, this.emisor());
    }
  }

  abrirPdf(): void {
    const doc = this.factura();
    if (doc) {
      abrirFacturaPdf(doc, this.emisor());
    }
  }

  imprimirPos(): void {
    const doc = this.factura();
    if (doc) {
      abrirHtml(buildFacturaPosHtml(doc, this.emisor()), { print: true, width: 420, height: 900 });
    }
  }

  enviarCorreo(): void {
    const doc = this.factura();
    if (!doc) {
      return;
    }
    this.api.actualizar(doc.id, { correo_estado: 'enviado' }).subscribe({
      next: (actual) => this.factura.set(actual),
      error: (err) => this.errorMessage.set(apiErrorMessage(err)),
    });
    const email = doc.cliente?.email;
    if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Factura #${doc.id}`)}`;
    }
  }

  anular(): void {
    const doc = this.factura();
    if (!doc || !confirm('¿Aplicar nota de anulación a este comprobante?')) {
      return;
    }
    this.api.actualizar(doc.id, { estado: 'anulada' }).subscribe({
      next: (actual) => this.factura.set(actual),
      error: (err) => this.errorMessage.set(apiErrorMessage(err)),
    });
  }

  pasoGeneracion(): string {
    const doc = this.factura();
    return doc ? new Date(doc.fecha).toLocaleDateString('es-GT') : '';
  }

  pasoTributario(): string {
    const t = this.factura()?.tributacion;
    if (t === 'aceptadas') {
      return 'Aceptado por la autoridad tributaria';
    }
    if (t === 'rechazadas') {
      return 'Rechazado';
    }
    if (t === 'no_entregado') {
      return 'No entregado';
    }
    return 'No requiere validación tributaria';
  }

  pasoCorreo(): string {
    return this.factura()?.correo_estado === 'enviado' ? 'Correo enviado' : 'Revise el correo del receptor';
  }

  pasoFinal(): string {
    const estado = this.factura()?.estado;
    if (estado === 'anulada') {
      return 'Documento anulado';
    }
    if (estado === 'pendiente') {
      return 'Pendiente de completar';
    }
    return 'Documento cancelado';
  }

  condicion(): string {
    return condicionLabel(this.factura()?.condicion_venta);
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
