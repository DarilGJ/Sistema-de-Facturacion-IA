import { Component, OnInit, computed, signal } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { BodegaPedido, LineaPedido, PedidoService, PedidoSugerido } from '../../core/services/pedido.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

@Component({
  selector: 'app-pedido-sugerido',
  imports: [InventarioNav, UiIcon],
  templateUrl: './pedido-sugerido.html',
  styleUrls: ['./inventario-shared.css', './pedido-sugerido.css'],
})
export class PedidoSugeridoPage implements OnInit {
  readonly vista = signal<'bodegas' | 'central'>('bodegas');
  readonly bodegaId = signal<number | null>(null);
  readonly busqueda = signal('');
  readonly soloPedir = signal(true);
  readonly abierto = signal<number | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly pedido = signal<PedidoSugerido | null>(null);

  readonly bodegaActiva = computed(() => {
    const data = this.pedido();
    if (!data?.bodegas.length) {
      return null;
    }
    return data.bodegas.find((bodega) => bodega.id === this.bodegaId()) || data.bodegas[0];
  });

  readonly lineas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const origen = this.vista() === 'central' ? this.pedido()?.central || [] : this.bodegaActiva()?.lineas || [];
    return origen.filter((linea) => {
      if (this.soloPedir() && linea.pedir <= 0 && !linea.deshacer) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        linea.nombre.toLowerCase().includes(q) ||
        linea.sku.toLowerCase().includes(q) ||
        linea.categoria.toLowerCase().includes(q) ||
        linea.proveedor.toLowerCase().includes(q)
      );
    });
  });

  constructor(private readonly pedidos: PedidoService) {}


  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.pedidos.sugerido().subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        if (!this.bodegaId() && pedido.bodegas[0]) {
          this.bodegaId.set(pedido.bodegas[0].id);
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudo armar el pedido sugerido.'));
      },
    });
  }

  elegirVista(vista: 'bodegas' | 'central'): void {
    this.vista.set(vista);
    this.abierto.set(null);
  }

  elegirBodega(bodega: BodegaPedido): void {
    this.vista.set('bodegas');
    this.bodegaId.set(bodega.id);
    this.abierto.set(null);
  }

  toggleDetalle(id: number): void {
    this.abierto.set(this.abierto() === id ? null : id);
  }

  quetzales(value: number): string {
    return `Q ${Number(value || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  imprimir(): void {
    window.print();
  }

  reparto(linea: LineaPedido): string {
    return (linea.reparto || []).map((parte) => `${parte.bodega} ${parte.pedir}`).join(' · ');
  }

  esRiesgo(motivo: string): boolean {
    return motivo.toLowerCase().includes('arruin');
  }
}
