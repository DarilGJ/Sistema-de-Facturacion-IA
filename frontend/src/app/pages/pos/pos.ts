import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { FacturaService } from '../../core/services/factura.service';
import { CarritoLinea } from '../../core/models/factura.model';
import { Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';

const ITBIS = 0.18;

@Component({
  selector: 'app-pos',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './pos.html',
  styleUrl: './pos.css',
})
export class Pos implements OnInit {
  readonly busqueda = signal('');
  readonly clienteId = signal<number | null>(null);
  readonly metodoPago = signal<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  readonly carrito = signal<CarritoLinea[]>([]);
  readonly loading = signal(false);
  readonly emitting = signal(false);
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
    readonly facturas: FacturaService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.inventario.cargarCatalogos().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
    this.facturas.listar().subscribe({ error: () => undefined });
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
    if (producto.stock_actual < 1) {
      return;
    }

    this.errorMessage.set('');
    this.carrito.update((lineas) => {
      const existente = lineas.find((l) => l.id_producto === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock_actual) {
          return lineas;
        }
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
          const siguiente = Math.min(l.stock, Math.max(0, l.cantidad + delta));
          return { ...l, cantidad: siguiente };
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

  emitir(): void {
    const idCliente = this.clienteId();
    if (!idCliente) {
      this.errorMessage.set('Selecciona un cliente para emitir la factura.');
      return;
    }
    if (!this.carrito().length) {
      this.errorMessage.set('Agrega productos al ticket.');
      return;
    }

    this.emitting.set(true);
    this.errorMessage.set('');

    this.facturas
      .crear({
        id_cliente: idCliente,
        metodo_pago: this.metodoPago(),
        items: this.carrito().map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad })),
      })
      .subscribe({
        next: () => {
          this.emitting.set(false);
          this.carrito.set([]);
          this.inventario.listarProductos().subscribe({ error: () => undefined });
        },
        error: (err) => {
          this.emitting.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo emitir la factura.'));
        },
      });
  }
}
