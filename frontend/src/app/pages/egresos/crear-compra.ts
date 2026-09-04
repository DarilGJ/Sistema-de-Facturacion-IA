import { DecimalPipe } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InventarioService } from '../../core/services/inventario.service';
import { CompraService } from '../../core/services/compra.service';
import { Compra, CompraLinea } from '../../core/models/compra.model';
import { Producto, Proveedor } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const IVA = 0.12;

@Component({
  selector: 'app-crear-compra',
  imports: [DecimalPipe, FormsModule, UiIcon],
  templateUrl: './crear-compra.html',
  styleUrls: ['../comprobantes/crear-factura.css', './crear-compra.css'],
})
export class CrearCompra implements OnInit {
  readonly auth = inject(AuthService);
  readonly inventario = inject(InventarioService);
  readonly compras = inject(CompraService);
  private readonly route = inject(ActivatedRoute);

  readonly seccionReceptor = signal(true);
  readonly seccionProductos = signal(true);
  readonly seccionPago = signal(true);
  readonly seccionNotas = signal(true);

  readonly fechaEmision = signal(this.hoy());
  readonly numeroProveedor = signal('');
  readonly sucursal = signal('principal');
  readonly busquedaProveedor = signal('');
  readonly proveedoresOpen = signal(false);
  readonly proveedorId = signal<number | null>(null);
  readonly requerimientos = signal('');
  readonly canalVenta = signal('No');
  readonly moneda = signal('Quetzal');
  readonly vendedor = signal('');
  readonly condicionVenta = signal('contado');
  readonly plazo = signal(0);
  readonly plazoUnidad = signal<'dias' | 'meses' | 'anio'>('meses');
  readonly vencimiento = signal(this.hoy());
  readonly optContacto = signal(true);
  readonly optTaller = signal(false);
  readonly optOtras = signal(false);
  readonly optCuentaAjena = signal(false);

  readonly catalogoTipo = signal<'producto' | 'servicio'>('producto');
  readonly filtrarProveedor = signal(false);
  readonly bodegaId = signal(0);
  readonly busquedaProducto = signal('');
  readonly productosOpen = signal(false);
  readonly formProductoOpen = signal(false);
  readonly nuevoSku = signal('');
  readonly nuevoNombre = signal('');
  readonly nuevoPrecio = signal(0);

  private lineaSeq = 1;
  readonly lineas = signal<CompraLinea[]>([this.lineaVacia()]);
  readonly descuentoDoc = signal(0);
  readonly formaPago = signal('efectivo');
  readonly notas = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly proveedor = computed(
    () => this.inventario.proveedores().find((p) => p.id === this.proveedorId()) ?? null
  );

  readonly numeroPreview = computed(() => {
    const ids = this.compras.compras().map((c) => c.id);
    return (Math.max(0, ...ids) || 0) + 1;
  });

  readonly proveedoresFiltrados = computed(() => {
    const q = this.busquedaProveedor().trim().toLowerCase();
    return this.inventario
      .proveedores()
      .filter((p) => p.estado)
      .filter((p) => {
        if (!q) {
          return true;
        }
        return (
          this.nombreProveedor(p).toLowerCase().includes(q) ||
          (p.nit || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  });

  readonly productosFiltrados = computed(() => {
    const q = this.busquedaProducto().trim().toLowerCase();
    const tipo = this.catalogoTipo();
    const idProv = this.proveedorId();
    return this.inventario
      .productos()
      .filter((p) => p.estado)
      .filter((p) => (tipo === 'servicio' ? this.esServicio(p) : !this.esServicio(p)))
      .filter((p) => !this.filtrarProveedor() || !idProv || p.id_proveedor === idProv)
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
  readonly descuentoLineas = computed(() =>
    this.lineasValidas().reduce((acc, linea) => acc + Math.max(0, linea.descuento), 0)
  );
  readonly descuentoMonto = computed(() =>
    Math.min(this.subtotal(), this.descuentoLineas() + Math.max(0, Number(this.descuentoDoc()) || 0))
  );
  readonly montoBruto = computed(() => Math.round((this.subtotal() - this.descuentoMonto()) * 100) / 100);
  readonly iva = computed(() => Math.round(this.montoBruto() * IVA * 100) / 100);
  readonly total = computed(() => Math.round((this.montoBruto() + this.iva()) * 100) / 100);
  readonly esCredito = computed(() => this.condicionVenta() === 'credito');

  ngOnInit(): void {
    this.vendedor.set(this.auth.user()?.nombre || 'Compras');
    this.loading.set(true);
    this.inventario.cargarCatalogos().subscribe({
      next: () => {
        this.loading.set(false);
        const principal =
          this.inventario.almacenes().find((item) => item.principal && item.estado) ||
          this.inventario.almacenes().find((item) => item.estado);
        if (principal) {
          this.bodegaId.set(principal.id);
        }
        this.cargarReutilizar();
      },
      error: () => this.loading.set(false),
    });
    this.compras.listar().subscribe({ error: () => undefined });
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
    this.proveedoresOpen.set(false);
    this.productosOpen.set(false);
  }

  toNumber(value: string | number): number {
    return Number(value) || 0;
  }

  nombreProveedor(p: Proveedor | null): string {
    if (!p) {
      return 'Proveedor';
    }
    return p.nombre_comercial || p.razon_social || p.nombre || 'Proveedor';
  }

  identificacion(p: Proveedor | null): string {
    return p?.nit || 'Sin identificación';
  }

  esServicio(producto: Producto): boolean {
    return producto.tipo === 'servicio' || String(producto.categoria || '').toLowerCase().includes('servicio');
  }

  seleccionarProveedor(proveedor: Proveedor, event: Event): void {
    event.stopPropagation();
    this.proveedorId.set(proveedor.id);
    this.busquedaProveedor.set(`${this.nombreProveedor(proveedor)} · ${this.identificacion(proveedor)}`);
    this.proveedoresOpen.set(false);
    this.errorMessage.set('');
    if (proveedor.metodo_cancelacion === 'credito') {
      this.condicionVenta.set('credito');
      this.plazo.set(proveedor.plazo || 1);
      this.plazoUnidad.set(proveedor.plazo_unidad || 'meses');
      this.recalcVencimiento();
    }
  }

  setCondicion(value: string): void {
    this.condicionVenta.set(value);
    this.recalcVencimiento();
  }

  setPlazo(value: string | number): void {
    this.plazo.set(Math.max(0, Number(value) || 0));
    this.recalcVencimiento();
  }

  setPlazoUnidad(value: 'dias' | 'meses' | 'anio'): void {
    this.plazoUnidad.set(value);
    this.recalcVencimiento();
  }

  setFecha(value: string): void {
    this.fechaEmision.set(value);
    this.recalcVencimiento();
  }

  importar(kind: 'xml' | 'pdf', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.numeroProveedor.set(file.name.replace(/\.[^.]+$/, '').slice(0, 40));
    this.notas.set(`Importado desde ${kind.toUpperCase()}: ${file.name}`);
  }

  agregarProducto(producto: Producto, event: Event): void {
    event.stopPropagation();
    if (!this.proveedorId()) {
      this.errorMessage.set('Primero selecciona el proveedor.');
      return;
    }
    this.errorMessage.set('');
    const precio = Number(producto.costo_compra) || Number(producto.precio_venta) || 0;
    this.lineas.update((rows) => {
      const vacia = rows.find((l) => !l.id_producto);
      const existente = rows.find((l) => l.id_producto === producto.id);
      if (existente) {
        return rows.map((l) => (l.id_producto === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      const nueva: CompraLinea = {
        uid: this.lineaSeq++,
        id_producto: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        unidad: producto.unidad_medida || 'UND',
        precio,
        descuento: 0,
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

  setCantidad(uid: number, value: string): void {
    const cantidad = Math.max(1, Math.floor(Number(value) || 1));
    this.lineas.update((rows) => rows.map((l) => (l.uid === uid ? { ...l, cantidad } : l)));
  }

  setPrecio(uid: number, value: string): void {
    const precio = Math.max(0, Number(value) || 0);
    this.lineas.update((rows) => rows.map((l) => (l.uid === uid ? { ...l, precio } : l)));
  }

  setDescuento(uid: number, value: string): void {
    const descuento = Math.max(0, Number(value) || 0);
    this.lineas.update((rows) => rows.map((l) => (l.uid === uid ? { ...l, descuento } : l)));
  }

  quitar(uid: number): void {
    this.lineas.update((rows) => rows.filter((l) => l.uid !== uid));
    if (!this.lineas().some((l) => !l.id_producto)) {
      this.lineas.update((rows) => [...rows, this.lineaVacia()]);
    }
  }

  lineaSubtotal(linea: CompraLinea): number {
    return Math.round(linea.precio * linea.cantidad * 100) / 100;
  }

  lineaNeto(linea: CompraLinea): number {
    return Math.round(Math.max(0, this.lineaSubtotal(linea) - linea.descuento) * 100) / 100;
  }

  lineaIva(linea: CompraLinea): number {
    return Math.round(this.lineaNeto(linea) * IVA * 100) / 100;
  }

  lineaTotal(linea: CompraLinea): number {
    return Math.round((this.lineaNeto(linea) + this.lineaIva(linea)) * 100) / 100;
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
        stock_actual: 0,
        stock_minimo: 0,
        estado: true,
        id_proveedor: this.proveedorId(),
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

  previsualizar(): void {
    const prov = this.proveedor();
    const filas = this.lineasValidas()
      .map(
        (l) =>
          `<tr><td>${l.nombre}</td><td>${l.cantidad}</td><td>${this.lineaNeto(l).toFixed(2)}</td><td>${this.lineaTotal(l).toFixed(2)}</td></tr>`
      )
      .join('');
    const html = `<html><head><title>Compra</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}</style></head><body>
      <h1>Compra</h1>
      <p><strong>Proveedor:</strong> ${this.nombreProveedor(prov)} · ${this.identificacion(prov)}</p>
      <p><strong>Fecha:</strong> ${this.fechaEmision()} · <strong>Documento:</strong> ${this.numeroProveedor() || this.numeroPreview()}</p>
      <table><thead><tr><th>Producto</th><th>Cant.</th><th>Neto</th><th>Total</th></tr></thead><tbody>${filas}</tbody></table>
      <p><strong>Total: ${this.total().toFixed(2)} GTQ</strong></p>
      </body></html>`;
    const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  guardar(): void {
    const idProveedor = this.proveedorId();
    if (!idProveedor) {
      this.errorMessage.set('Selecciona un proveedor para registrar la compra.');
      return;
    }
    if (!this.lineasValidas().length) {
      this.errorMessage.set('Agrega al menos un producto o servicio.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.compras
      .crear({
        id_proveedor: idProveedor,
        id_bodega: this.bodegaId() || undefined,
        numero_proveedor: this.numeroProveedor() || undefined,
        metodo_pago: this.formaPago() as 'efectivo' | 'tarjeta' | 'transferencia',
        condicion_venta: this.condicionVenta() === 'credito' ? 'credito' : 'contado',
        moneda: this.moneda(),
        vendedor: this.vendedor(),
        canal: this.canalVenta(),
        requerimientos: this.requerimientos(),
        plazo: this.plazo(),
        plazo_unidad: this.plazoUnidad(),
        vencimiento: this.esCredito() ? this.vencimiento() : undefined,
        notas: this.notas(),
        fecha: this.fechaEmision(),
        descuento: Number(this.descuentoDoc()) || 0,
        items: this.lineasValidas().map((l) => ({
          id_producto: l.id_producto,
          cantidad: l.cantidad,
          precio_unitario: l.precio,
          descuento: l.descuento,
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.lineas.set([this.lineaVacia()]);
          this.descuentoDoc.set(0);
          this.numeroProveedor.set('');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar la compra.'));
        },
      });
  }

  private recalcVencimiento(): void {
    const base = new Date(`${this.fechaEmision()}T00:00:00`);
    if (Number.isNaN(base.getTime())) {
      return;
    }
    const n = this.plazo();
    if (this.plazoUnidad() === 'meses') {
      base.setMonth(base.getMonth() + n);
    } else if (this.plazoUnidad() === 'anio') {
      base.setFullYear(base.getFullYear() + n);
    } else {
      base.setDate(base.getDate() + n);
    }
    const pad = (v: number) => String(v).padStart(2, '0');
    this.vencimiento.set(`${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`);
  }

  private cargarReutilizar(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('reutilizar'));
    if (!id) {
      return;
    }
    this.compras.obtener(id).subscribe({
      next: (doc) => this.aplicarCompra(doc),
      error: (err: unknown) => this.errorMessage.set(apiErrorMessage(err, 'No se pudo reutilizar la compra.')),
    });
  }

  private aplicarCompra(doc: Compra): void {
    this.proveedorId.set(doc.id_proveedor);
    const proveedor = this.inventario.proveedores().find((p) => p.id === doc.id_proveedor) || null;
    if (proveedor) {
      this.busquedaProveedor.set(`${this.nombreProveedor(proveedor)} · ${this.identificacion(proveedor)}`);
    }
    this.numeroProveedor.set(doc.numero_proveedor || '');
    this.condicionVenta.set(doc.condicion_venta === 'credito' ? 'credito' : 'contado');
    this.formaPago.set(doc.metodo_pago);
    this.moneda.set(doc.moneda || 'Quetzal');
    this.vendedor.set(doc.vendedor || this.auth.user()?.nombre || 'Compras');
    this.canalVenta.set(doc.canal || 'No');
    this.requerimientos.set(doc.requerimientos || '');
    this.plazo.set(doc.plazo || 0);
    this.plazoUnidad.set(doc.plazo_unidad || 'meses');
    this.notas.set(doc.notas || '');
    this.descuentoDoc.set(Number(doc.descuento) || 0);
    if (doc.id_bodega) {
      this.bodegaId.set(doc.id_bodega);
    }
    const lineas = (doc.items || []).map((linea) => ({
      uid: this.lineaSeq++,
      id_producto: linea.id_producto,
      sku: linea.producto?.sku || '',
      nombre: linea.descripcion,
      unidad: 'UND',
      precio: Number(linea.precio_unitario) || 0,
      descuento: Number(linea.descuento) || 0,
      cantidad: Number(linea.cantidad) || 1,
    }));
    this.lineas.set(lineas.length ? [...lineas, this.lineaVacia()] : [this.lineaVacia()]);
    this.recalcVencimiento();
  }

  private lineaVacia(): CompraLinea {
    return {
      uid: this.lineaSeq++,
      id_producto: 0,
      sku: '',
      nombre: '',
      unidad: 'UND',
      precio: 0,
      descuento: 0,
      cantidad: 1,
    };
  }

  private hoy(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
