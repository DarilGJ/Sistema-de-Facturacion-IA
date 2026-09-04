import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InventarioService } from '../../core/services/inventario.service';
import { FacturaService } from '../../core/services/factura.service';
import { CotizacionService } from '../../core/services/cotizacion.service';
import { CarritoLinea } from '../../core/models/factura.model';
import { Cliente, Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const IVA = 0.18;

@Component({
  selector: 'app-crear-factura',
  imports: [CurrencyPipe, FormsModule, UiIcon],
  templateUrl: './crear-factura.html',
  styleUrl: './crear-factura.css',
})
export class CrearFactura implements OnInit {
  readonly auth = inject(AuthService);
  readonly inventario = inject(InventarioService);
  readonly facturas = inject(FacturaService);
  readonly cotizaciones = inject(CotizacionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly modo = signal<'factura' | 'cotizacion'>('factura');
  readonly esCotizacion = computed(() => this.modo() === 'cotizacion');
  readonly tituloDocumento = computed(() => (this.esCotizacion() ? 'Cotización' : 'Factura Electrónica'));
  readonly etiquetaAccion = computed(() =>
    this.esCotizacion() ? (this.emitting() ? 'Guardando…' : 'Guardar cotización') : this.emitting() ? 'Procesando…' : 'Procesar Factura'
  );

  readonly seccionReceptor = signal(true);
  readonly seccionProductos = signal(true);
  readonly seccionPago = signal(true);
  readonly seccionNotas = signal(false);

  readonly exportacion = signal(false);
  readonly fechaEmision = signal(this.hoy());
  readonly tipoComprobante = signal('Factura');
  readonly busquedaCliente = signal('');
  readonly clientesOpen = signal(false);
  readonly clienteId = signal<number | null>(null);
  readonly requerimientos = signal('');
  readonly canalVenta = signal('No');
  readonly moneda = signal('Quetzal');
  readonly vendedor = signal('');
  readonly condicionVenta = signal('contado');
  readonly optContacto = signal(true);
  readonly optTaller = signal(false);
  readonly optOtras = signal(false);
  readonly optCuentaAjena = signal(false);

  readonly catalogoTipo = signal<'producto' | 'servicio'>('producto');
  readonly bodegaId = signal(1);
  readonly busquedaProducto = signal('');
  readonly productosOpen = signal(false);
  readonly formProductoOpen = signal(false);
  readonly nuevoSku = signal('');
  readonly nuevoNombre = signal('');
  readonly nuevoPrecio = signal(0);

  private lineaSeq = 1;
  readonly lineas = signal<CarritoLinea[]>([
    this.lineaVacia(),
    this.lineaVacia(),
    this.lineaVacia(),
    this.lineaVacia(),
    this.lineaVacia(),
  ]);
  readonly descuento = signal(0);
  readonly formaPago = signal<string>('efectivo');
  readonly notas = signal('');
  readonly loading = signal(false);
  readonly emitting = signal(false);
  readonly errorMessage = signal('');

  readonly cliente = computed(() =>
    this.inventario.clientes().find((c) => c.id === this.clienteId()) ?? null
  );

  readonly numeroPreview = computed(() => {
    const ids = this.esCotizacion()
      ? this.cotizaciones.cotizaciones().map((f) => f.id)
      : this.facturas.facturas().map((f) => f.id);
    return (Math.max(0, ...ids) || 0) + 1;
  });

  readonly clientesFiltrados = computed(() => {
    const q = this.busquedaCliente().trim().toLowerCase();
    return this.inventario
      .clientes()
      .filter((c) => c.estado)
      .filter((c) => {
        if (!q) {
          return true;
        }
        return (
          c.nombre.toLowerCase().includes(q) ||
          c.nit.toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  });

  readonly productosFiltrados = computed(() => {
    const q = this.busquedaProducto().trim().toLowerCase();
    const tipo = this.catalogoTipo();
    return this.inventario
      .productos()
      .filter((p) => p.estado)
      .filter((p) => (tipo === 'servicio' ? this.esServicio(p) : !this.esServicio(p)))
      .filter((p) => {
        if (!q) {
          return true;
        }
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  });

  readonly lineasValidas = computed(() => this.lineas().filter((l) => l.id_producto > 0 && l.cantidad > 0));
  readonly subtotal = computed(() =>
    this.lineasValidas().reduce((acc, linea) => acc + linea.precio * linea.cantidad, 0)
  );
  readonly descuentoMonto = computed(() => Math.min(this.subtotal(), Math.max(0, Number(this.descuento()) || 0)));
  readonly montoBruto = computed(() => Math.round((this.subtotal() - this.descuentoMonto()) * 100) / 100);
  readonly iva = computed(() => Math.round(this.montoBruto() * IVA * 100) / 100);
  readonly total = computed(() => Math.round((this.montoBruto() + this.iva()) * 100) / 100);

  ngOnInit(): void {
    const modo = this.route.snapshot.data['modo'] === 'cotizacion' ? 'cotizacion' : 'factura';
    this.modo.set(modo);
    if (modo === 'cotizacion') {
      this.tipoComprobante.set('Cotización');
      this.formaPago.set('contado');
    }
    this.vendedor.set(this.auth.user()?.nombre || 'Vendedor');
    this.loading.set(true);
    this.inventario.cargarCatalogos().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
    if (modo === 'cotizacion') {
      this.cotizaciones.listar().subscribe({ error: () => undefined });
    } else {
      this.facturas.listar().subscribe({ error: () => undefined });
    }
  }

  toggle(seccion: 'receptor' | 'productos' | 'pago' | 'notas' | 'productoForm'): void {
    if (seccion === 'receptor') {
      this.seccionReceptor.update((open) => !open);
    }
    if (seccion === 'productos') {
      this.seccionProductos.update((open) => !open);
    }
    if (seccion === 'pago') {
      this.seccionPago.update((open) => !open);
    }
    if (seccion === 'notas') {
      this.seccionNotas.update((open) => !open);
    }
    if (seccion === 'productoForm') {
      this.formProductoOpen.update((open) => !open);
    }
  }

  @HostListener('document:click')
  closeSuggest(): void {
    this.clientesOpen.set(false);
    this.productosOpen.set(false);
  }

  toNumber(value: string | number): number {
    return Number(value) || 0;
  }

  esServicio(producto: Producto): boolean {
    return producto.tipo === 'servicio' || String(producto.categoria || '').toLowerCase().includes('servicio');
  }

  seleccionarCliente(cliente: Cliente, event: Event): void {
    event.stopPropagation();
    this.clienteId.set(cliente.id);
    this.busquedaCliente.set(`${cliente.nombre} · ${cliente.nit}`);
    this.clientesOpen.set(false);
  }

  agregarProducto(producto: Producto, event: Event): void {
    event.stopPropagation();
    if (!this.esCotizacion() && !this.esServicio(producto) && producto.stock_actual < 1) {
      this.errorMessage.set(`Sin stock para ${producto.nombre}.`);
      return;
    }
    this.errorMessage.set('');
    this.lineas.update((rows) => {
      const vacia = rows.find((l) => !l.id_producto);
      const existente = rows.find((l) => l.id_producto === producto.id);
      if (existente) {
        const max =
          this.esCotizacion() || this.esServicio(producto)
            ? existente.cantidad + 1
            : Math.min(existente.stock, existente.cantidad + 1);
        return rows.map((l) => (l.id_producto === producto.id ? { ...l, cantidad: max } : l));
      }
      const nueva: CarritoLinea = {
        uid: this.lineaSeq++,
        id_producto: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        precio: Number(producto.precio_venta),
        stock: producto.stock_actual,
        cantidad: 1,
      };
      if (vacia) {
        return rows.map((l) => (l.uid === vacia.uid ? nueva : l)).concat(this.lineaVacia());
      }
      return [...rows, nueva, this.lineaVacia()];
    });
    this.busquedaProducto.set('');
    this.productosOpen.set(false);
  }

  setSku(uid: number, value: string): void {
    const sku = value.trim();
    this.lineas.update((rows) =>
      rows.map((l) => {
        if (l.uid !== uid) {
          return l;
        }
        const found = this.inventario.productos().find((p) => p.estado && p.sku.toLowerCase() === sku.toLowerCase());
        if (!found) {
          return { ...l, sku };
        }
        return {
          ...l,
          id_producto: found.id,
          sku: found.sku,
          nombre: found.nombre,
          precio: Number(found.precio_venta),
          stock: found.stock_actual,
        };
      })
    );
    this.asegurarFilaVacia();
  }

  setNombre(uid: number, value: string): void {
    const nombre = value;
    this.lineas.update((rows) =>
      rows.map((l) => {
        if (l.uid !== uid) {
          return l;
        }
        const found = this.inventario
          .productos()
          .find((p) => p.estado && p.nombre.toLowerCase() === nombre.trim().toLowerCase());
        if (!found) {
          return { ...l, nombre };
        }
        return {
          ...l,
          id_producto: found.id,
          sku: found.sku,
          nombre: found.nombre,
          precio: Number(found.precio_venta),
          stock: found.stock_actual,
        };
      })
    );
    this.asegurarFilaVacia();
  }

  setCantidad(uid: number, value: string): void {
    const cantidad = Math.max(1, Math.floor(Number(value) || 1));
    this.lineas.update((rows) =>
      rows.map((l) => {
        if (l.uid !== uid) {
          return l;
        }
        return {
          ...l,
          cantidad:
            this.esCotizacion() || l.stock <= 0 ? cantidad : Math.min(l.stock, cantidad),
        };
      })
    );
  }

  setPrecio(uid: number, value: string): void {
    const precio = Math.max(0, Number(value) || 0);
    this.lineas.update((rows) => rows.map((l) => (l.uid === uid ? { ...l, precio } : l)));
  }

  quitar(uid: number): void {
    this.lineas.update((rows) => rows.filter((l) => l.uid !== uid));
    this.asegurarFilaVacia();
  }

  crearProductoRapido(): void {
    const sku = this.nuevoSku().trim();
    const nombre = this.nuevoNombre().trim();
    const precio = Number(this.nuevoPrecio()) || 0;
    if (!sku || !nombre) {
      this.errorMessage.set('Completa código y nombre del producto.');
      return;
    }
    this.inventario
      .crearProducto({
        sku,
        nombre,
        tipo: this.catalogoTipo() === 'servicio' ? 'servicio' : 'producto',
        categoria: this.catalogoTipo() === 'servicio' ? 'Servicios' : 'General',
        unidad_medida: this.catalogoTipo() === 'servicio' ? 'unidad de servicio' : 'unidad',
        precio_venta: precio,
        costo_compra: precio,
        stock_actual: this.catalogoTipo() === 'servicio' ? 0 : 1,
        stock_minimo: 0,
        estado: true,
      })
      .subscribe({
        next: (productos) => {
          this.formProductoOpen.set(false);
          this.nuevoSku.set('');
          this.nuevoNombre.set('');
          this.nuevoPrecio.set(0);
          const creado = productos.find((p) => p.sku === sku);
          if (creado) {
            this.agregarProducto(creado, new Event('click'));
          }
        },
        error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err)),
      });
  }

  procesar(): void {
    const idCliente = this.clienteId();
    if (!idCliente) {
      this.errorMessage.set(
        this.esCotizacion()
          ? 'Selecciona un receptor para guardar la cotización.'
          : 'Selecciona un receptor para procesar la factura.'
      );
      return;
    }
    if (!this.lineasValidas().length) {
      this.errorMessage.set('Agrega al menos un producto o servicio.');
      return;
    }

    this.emitting.set(true);
    this.errorMessage.set('');
    const items = this.lineasValidas().map((l) => ({
      id_producto: l.id_producto,
      cantidad: l.cantidad,
      precio_unitario: l.precio,
    }));

    if (this.esCotizacion()) {
      this.cotizaciones
        .crear({
          id_cliente: idCliente,
          metodo_pago: this.formaPago() === 'credito' ? 'credito' : 'contado',
          items,
        })
        .subscribe({
          next: () => {
            this.emitting.set(false);
            this.lineas.set([
              this.lineaVacia(),
              this.lineaVacia(),
              this.lineaVacia(),
              this.lineaVacia(),
              this.lineaVacia(),
            ]);
            void this.router.navigate(['/cotizaciones']);
          },
          error: (err: unknown) => {
            this.emitting.set(false);
            this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar la cotización.'));
          },
        });
      return;
    }

    this.facturas
      .crear({
        id_cliente: idCliente,
        metodo_pago: this.formaPago() as 'efectivo' | 'tarjeta' | 'transferencia',
        items,
      })
      .subscribe({
        next: () => {
          this.emitting.set(false);
          this.lineas.set([this.lineaVacia()]);
          if (!this.router.url.includes('/pos')) {
            void this.router.navigate(['/comprobantes/facturas']);
          }
        },
        error: (err: unknown) => {
          this.emitting.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo procesar la factura.'));
        },
      });
  }

  private lineaVacia(): CarritoLinea {
    return {
      uid: this.lineaSeq++,
      id_producto: 0,
      sku: '',
      nombre: '',
      precio: 0,
      stock: 0,
      cantidad: 1,
    };
  }

  private asegurarFilaVacia(): void {
    if (!this.lineas().some((l) => !l.id_producto)) {
      this.lineas.update((rows) => [...rows, this.lineaVacia()]);
    }
  }

  private hoy(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
