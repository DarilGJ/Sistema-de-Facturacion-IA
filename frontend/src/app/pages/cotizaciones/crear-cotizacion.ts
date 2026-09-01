import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventarioService } from '../../core/services/inventario.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { CarritoLinea } from '../../core/models/factura.model';
import { Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';

const ITBIS = 0.18;

@Component({
  selector: 'app-crear-cotizacion',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './crear-cotizacion.html',
  styleUrl: '../pos/pos.css',
})
export class CrearCotizacion implements OnInit {
  readonly busqueda = signal('');
  readonly clienteId = signal<number | null>(null);
  readonly metodoPago = signal<'contado' | 'credito'>('contado');
  readonly carrito = signal<CarritoLinea[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly productosVisibles = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.inventario
      .productos()
      .filter((p) => p.estado)
      .filter((p) => {
        if (!q) {
          return true;
        }
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q)
        );
      });
  });

  readonly subtotal = computed(() =>
    this.carrito().reduce((acc, linea) => acc + linea.precio * linea.cantidad, 0)
  );
  readonly itbis = computed(() => Math.round(this.subtotal() * ITBIS * 100) / 100);
  readonly total = computed(() => Math.round((this.subtotal() + this.itbis()) * 100) / 100);

  constructor(
    readonly inventario: InventarioService,
    readonly cotizaciones: CotizacionService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.inventario.cargarCatalogos().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
    this.cotizaciones.listar().subscribe({ error: () => undefined });
  }

  clientesActivos() {
    return this.inventario.clientes().filter((c) => c.estado);
  }

  setCliente(value: number | string | null): void {
    this.clienteId.set(value === null || value === '' ? null : Number(value));
  }

  precio(producto: Producto): number {
    return Number(producto.precio_venta);
  }

  agregar(producto: Producto): void {
    this.errorMessage.set('');
    this.carrito.update((lineas) => {
      const existente = lineas.find((l) => l.id_producto === producto.id);
      if (existente) {
        return lineas.map((l) =>
          l.id_producto === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [
        ...lineas,
        {
          id_producto: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          precio: this.precio(producto),
          stock: producto.stock_actual,
          cantidad: 1,
        },
      ];
    });
  }

  cambiarCantidad(idProducto: number, delta: number): void {
    this.carrito.update((lineas) =>
      lineas
        .map((l) => {
          if (l.id_producto !== idProducto) {
            return l;
          }
          return { ...l, cantidad: Math.max(0, l.cantidad + delta) };
        })
        .filter((l) => l.cantidad > 0)
    );
  }

  quitar(idProducto: number): void {
    this.carrito.update((lineas) => lineas.filter((l) => l.id_producto !== idProducto));
  }

  vaciar(): void {
    this.carrito.set([]);
    this.errorMessage.set('');
  }

  guardar(): void {
    const idCliente = this.clienteId();
    if (!idCliente) {
      this.errorMessage.set('Selecciona un cliente para la cotización.');
      return;
    }
    if (!this.carrito().length) {
      this.errorMessage.set('Agrega productos a la cotización.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.cotizaciones
      .crear({
        id_cliente: idCliente,
        metodo_pago: this.metodoPago(),
        items: this.carrito().map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.carrito.set([]);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar la cotización.'));
        },
      });
  }
}
