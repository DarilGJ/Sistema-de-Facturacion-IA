import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { CompraService } from '../../core/services/compra.service';
import { FacturaService } from '../../core/services/factura.service';
import { InventarioService } from '../../core/services/inventario.service';
import { Factura } from '../../core/models/factura.model';
import { Compra } from '../../core/models/compra.model';
import { DevolucionInventario, KardexMovimiento, Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { InventarioNav } from '../inventario/inventario-nav';

interface Registro {
  id: number;
  tipo: string;
  nombre: string;
  referencia: string | null;
  monto: number;
  fecha: string;
  estado: string;
  detalle: string | null;
}

interface Fila {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
}

interface FelEstado {
  configurado: boolean;
  estado: string;
  message: string;
  modo: string;
}

@Component({
  selector: 'app-operacion',
  imports: [DatePipe, FormsModule, InventarioNav],
  templateUrl: './operacion.html',
  styleUrls: ['../inventario/inventario-shared.css', './operacion.css'],
})
export class Operacion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  readonly auth = inject(AuthService);
  readonly inventario = inject(InventarioService);
  readonly facturasApi = inject(FacturaService);
  readonly comprasApi = inject(CompraService);

  readonly titulo = signal('Módulo');
  readonly subtitulo = signal('');
  readonly kind = signal('reporte');
  readonly reporte = signal('general');
  readonly tipo = signal('gasto');
  readonly inventarioNav = signal(false);
  readonly notasModo = signal<'credito' | 'debito'>('credito');
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly infoMessage = signal('');
  readonly filas = signal<Fila[]>([]);
  readonly columnas = signal<string[]>(['Dato', 'Detalle', 'Valor', 'Estado', 'Fecha']);
  readonly registros = signal<Registro[]>([]);
  readonly fel = signal<FelEstado | null>(null);
  readonly facturas = signal<Factura[]>([]);
  readonly compras = signal<Compra[]>([]);
  readonly devoluciones = signal<DevolucionInventario[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly conteos = signal<Partial<Record<number, number>>>({});

  nombre = '';
  referencia = '';
  monto = 0;
  detalle = '';
  estado = 'activo';
  empresaNombre = '';
  empresaNit = '';
  empresaDireccion = '';

  readonly puedeCertificar = computed(() => {
    const rol = this.auth.user()?.rol;
    return rol === 'admin' || rol === 'contador';
  });

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.titulo.set(String(data['titulo'] || 'Módulo'));
      this.subtitulo.set(String(data['subtitulo'] || ''));
      this.kind.set(String(data['kind'] || 'reporte'));
      this.reporte.set(String(data['reporte'] || 'general'));
      this.tipo.set(String(data['tipo'] || 'gasto'));
      this.inventarioNav.set(Boolean(data['inventario']));
      this.notasModo.set(data['notas'] === 'debito' ? 'debito' : 'credito');
      this.cargar();
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.infoMessage.set('');
    const kind = this.kind();
    if (kind === 'registro' || kind === 'config') {
      this.cargarRegistros();
      return;
    }
    if (kind === 'sat' || kind === 'soporte') {
      this.cargarFel();
      return;
    }
    if (kind === 'cuentas' || kind === 'calendario') {
      this.cargarCuentas();
      return;
    }
    if (kind === 'notas') {
      this.cargarNotas();
      return;
    }
    this.inventario.cargarCatalogos().subscribe({
      next: () => {
        this.productos.set(this.inventario.productos());
        if (this.kind() === 'listas' || this.kind() === 'toma') {
          this.loading.set(false);
          return;
        }
        this.armarReporte();
      },
      error: (err) => this.fallo(err, 'No se pudo cargar el catálogo.'),
    });
  }

  guardarRegistro(): void {
    const nombre = this.nombre.trim();
    if (!nombre) {
      this.errorMessage.set('Escribe un nombre.');
      return;
    }
    if (this.monto < 0) {
      this.errorMessage.set('El monto no puede ser negativo.');
      return;
    }
    this.http
      .post<Registro>(`${this.api}/registros`, {
        tipo: this.tipo(),
        nombre,
        referencia: this.referencia,
        monto: this.monto,
        detalle: this.detalle,
        estado: this.estado || 'activo',
      })
      .subscribe({
        next: () => {
          this.nombre = '';
          this.referencia = '';
          this.monto = 0;
          this.detalle = '';
          this.cargarRegistros();
        },
        error: (err) => this.fallo(err, 'No se pudo guardar.'),
      });
  }

  desactivar(row: Registro): void {
    this.http.delete(`${this.api}/registros/${row.id}`).subscribe({
      next: () => this.cargarRegistros(),
      error: (err) => this.fallo(err, 'No se pudo desactivar.'),
    });
  }

  guardarEmpresa(): void {
    const body = {
      tipo: 'empresa',
      nombre: this.empresaNombre.trim() || 'Librerías El Regalito',
      referencia: this.empresaNit.trim(),
      monto: 0,
      detalle: this.empresaDireccion.trim(),
      estado: 'activo',
    };
    const actual = this.registros()[0];
    const req = actual
      ? this.http.put<Registro>(`${this.api}/registros/${actual.id}`, body)
      : this.http.post<Registro>(`${this.api}/registros`, body);
    req.subscribe({
      next: () => {
        this.infoMessage.set('Datos de la empresa guardados.');
        this.cargarRegistros();
      },
      error: (err) => this.fallo(err, 'No se pudo guardar la empresa.'),
    });
  }

  guardarPrecio(producto: Producto, campo: 'precio_venta' | 'precio_2' | 'precio_3', valor: string): void {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      this.errorMessage.set('El precio no puede ser negativo.');
      return;
    }
    this.inventario
      .actualizarProducto(producto.id, {
        ...this.payloadProducto(producto),
        [campo]: numero,
      })
      .subscribe({
        next: () => {
          this.productos.set(this.inventario.productos());
          this.infoMessage.set(`Precio actualizado para ${producto.nombre}.`);
        },
        error: (err) => this.fallo(err, 'No se pudo actualizar el precio.'),
      });
  }

  aplicarConteo(producto: Producto): void {
    const contado = Number(this.conteos()[producto.id]);
    if (!Number.isInteger(contado) || contado < 0) {
      this.errorMessage.set('El conteo debe ser un entero mayor o igual a 0.');
      return;
    }
    const actual = Number(producto.stock_actual) || 0;
    const delta = contado - actual;
    if (delta === 0) {
      this.infoMessage.set(`${producto.nombre} ya coincide con el sistema.`);
      return;
    }
    const bodega = this.inventario.almacenes().find((item) => item.principal) || this.inventario.almacenes()[0];
    if (!bodega) {
      this.errorMessage.set('Crea un almacén antes de registrar la toma física.');
      return;
    }
    this.inventario
      .crearAjuste({
        descripcion: `Toma física ${producto.sku}`,
        items: [
          {
            id_bodega: bodega.id,
            id_producto: producto.id,
            tipo: delta > 0 ? 'mas' : 'menos',
            cantidad_ajuste: Math.abs(delta),
          },
        ],
      })
      .subscribe({
        next: () => {
          this.infoMessage.set(`Toma física aplicada a ${producto.nombre}.`);
          this.inventario.listarProductos().subscribe(() => this.productos.set(this.inventario.productos()));
        },
        error: (err) => this.fallo(err, 'No se pudo aplicar el conteo. El producto debe existir en la bodega.'),
      });
  }

  setConteo(id: number, valor: string): void {
    this.conteos.update((rows) => ({ ...rows, [id]: Number(valor) }));
  }

  conteo(producto: Producto): number {
    const valor = this.conteos()[producto.id];
    return valor === undefined ? Number(producto.stock_actual) || 0 : valor;
  }

  cobrar(factura: Factura): void {
    this.facturasApi.actualizar(factura.id, { estado: 'cancelada' }).subscribe({
      next: () => this.cargarCuentas(),
      error: (err) => this.fallo(err, 'No se pudo registrar el cobro.'),
    });
  }

  pagar(compra: Compra): void {
    this.comprasApi.actualizar(compra.id, { estado: 'cancelada' }).subscribe({
      next: () => this.cargarCuentas(),
      error: (err) => this.fallo(err, 'No se pudo registrar el pago.'),
    });
  }

  certificar(factura: Factura): void {
    this.http.post(`${this.api}/fel/certificar/${factura.id}`, {}).subscribe({
      next: () => {
        this.infoMessage.set('El certificador autorizó el documento.');
        this.cargarFel();
      },
      error: (err) => this.fallo(err, 'La API FEL no autorizó el documento. Revisa la conexión.'),
    });
  }

  quetzal(valor: number | string | null | undefined): string {
    return `Q ${Number(valor || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private cargarRegistros(): void {
    const tipo = this.kind() === 'config' ? 'empresa' : this.tipo();
    this.http.get<Registro[]>(`${this.api}/registros`, { params: { tipo } }).subscribe({
      next: (rows) => {
        this.registros.set(rows);
        if (this.kind() === 'config' && rows[0]) {
          this.empresaNombre = rows[0].nombre;
          this.empresaNit = rows[0].referencia || '';
          this.empresaDireccion = rows[0].detalle || '';
        }
        this.loading.set(false);
      },
      error: (err) => this.fallo(err, 'No se pudieron cargar los registros.'),
    });
  }

  private cargarFel(): void {
    this.http.get<FelEstado>(`${this.api}/fel/estado`).subscribe({
      next: (estado) => {
        this.fel.set(estado);
        if (this.kind() === 'soporte') {
          this.http.get<{ ok: boolean }>(`${this.api}/health`).subscribe({
            next: (health) => {
              this.infoMessage.set(health.ok ? 'La API responde correctamente.' : 'La API no confirmó su estado.');
              this.facturasApi.listar().subscribe({
                next: (rows) => {
                  this.facturas.set(rows);
                  this.loading.set(false);
                },
                error: () => this.loading.set(false),
              });
            },
            error: (err) => this.fallo(err, 'No se pudo consultar la salud de la API.'),
          });
          return;
        }
        this.facturasApi.listar().subscribe({
          next: (rows) => {
            this.facturas.set(rows);
            this.loading.set(false);
          },
          error: (err) => this.fallo(err, 'No se pudieron cargar las facturas.'),
        });
      },
      error: (err) => this.fallo(err, 'No se pudo consultar el estado FEL.'),
    });
  }

  private cargarCuentas(): void {
    this.facturasApi.listar().subscribe({
      next: (facturas) => {
        this.facturas.set(facturas);
        this.comprasApi.listar().subscribe({
          next: (compras) => {
            this.compras.set(compras);
            this.loading.set(false);
          },
          error: (err) => this.fallo(err, 'No se pudieron cargar las compras.'),
        });
      },
      error: (err) => this.fallo(err, 'No se pudieron cargar las facturas.'),
    });
  }

  private cargarNotas(): void {
    if (this.notasModo() === 'debito') {
      this.tipo.set('nota_debito');
      this.cargarRegistros();
      return;
    }
    this.inventario.listarDevoluciones().subscribe({
      next: (rows) => {
        this.devoluciones.set(rows);
        this.loading.set(false);
      },
      error: (err) => this.fallo(err, 'No se pudieron cargar las notas de crédito.'),
    });
  }

  private armarReporte(): void {
    const productos = this.productos().filter((item) => item.estado);
    const reporte = this.reporte();
    if (reporte === 'listado' || reporte === 'margen' || reporte === 'valorizacion' || reporte === 'vencimientos' || reporte === 'abc') {
      this.desdeProductos(productos, reporte);
      this.loading.set(false);
      return;
    }
    if (reporte === 'ventas' || reporte === 'rentabilidad' || reporte === 'general') {
      this.facturasApi.listar().subscribe({
        next: (facturas) => {
          this.facturas.set(facturas);
          if (reporte === 'general') {
            this.comprasApi.listar().subscribe({
              next: (compras) => {
                this.compras.set(compras);
                this.reporteGeneral(productos, facturas, compras);
                this.loading.set(false);
              },
              error: (err) => this.fallo(err, 'No se pudieron cargar las compras.'),
            });
            return;
          }
          this.desdeVentas(productos, facturas, reporte);
          this.loading.set(false);
        },
        error: (err) => this.fallo(err, 'No se pudieron cargar las ventas.'),
      });
      return;
    }
    this.inventario.listarKardex({ page: 1, size: 100 }).subscribe({
      next: (page) => {
        this.desdeKardex(page.rows, reporte);
        if (page.total > page.rows.length) {
          this.infoMessage.set(`Se muestran ${page.rows.length} de ${page.total} movimientos.`);
        }
        this.loading.set(false);
      },
      error: (err) => this.fallo(err, 'No se pudo cargar el kárdex.'),
    });
  }

  private desdeProductos(productos: Producto[], reporte: string): void {
    if (reporte === 'vencimientos') {
      this.columnas.set(['SKU', 'Producto', 'Stock', 'Control de lote', 'Vencimiento']);
      this.filas.set(
        productos.map((item) => ({
          c1: item.sku,
          c2: item.nombre,
          c3: String(item.stock_actual),
          c4: 'Sin lote',
          c5: 'Sin fecha registrada',
        }))
      );
      this.infoMessage.set('El catálogo no guarda fechas de vencimiento por lote. Esta consulta muestra el stock actual.');
      return;
    }
    if (reporte === 'abc') {
      const orden = [...productos].sort((a, b) => this.valor(b) - this.valor(a));
      const total = orden.reduce((acc, item) => acc + this.valor(item), 0) || 1;
      let acum = 0;
      this.columnas.set(['SKU', 'Producto', 'Valor', '% acumulado', 'Clase']);
      this.filas.set(
        orden.map((item) => {
          acum += this.valor(item);
          const pct = (acum / total) * 100;
          const clase = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
          return {
            c1: item.sku,
            c2: item.nombre,
            c3: this.quetzal(this.valor(item)),
            c4: `${pct.toFixed(1)} %`,
            c5: clase,
          };
        })
      );
      return;
    }
    this.columnas.set(
      reporte === 'margen'
        ? ['SKU', 'Producto', 'Costo', 'Precio', 'Margen']
        : reporte === 'valorizacion'
          ? ['SKU', 'Producto', 'Stock', 'Costo', 'Valor']
          : ['SKU', 'Producto', 'Categoría', 'Stock', 'Precio']
    );
    this.filas.set(
      productos.map((item) => {
        const costo = Number(item.costo_compra) || 0;
        const precio = Number(item.precio_venta) || 0;
        const stock = Number(item.stock_actual) || 0;
        if (reporte === 'margen') {
          const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0;
          return { c1: item.sku, c2: item.nombre, c3: this.quetzal(costo), c4: this.quetzal(precio), c5: `${margen.toFixed(1)} %` };
        }
        if (reporte === 'valorizacion') {
          return { c1: item.sku, c2: item.nombre, c3: String(stock), c4: this.quetzal(costo), c5: this.quetzal(costo * stock) };
        }
        return { c1: item.sku, c2: item.nombre, c3: item.categoria || '—', c4: String(stock), c5: this.quetzal(precio) };
      })
    );
  }

  private desdeVentas(productos: Producto[], facturas: Factura[], reporte: string): void {
    const costos = new Map(productos.map((item) => [item.id, Number(item.costo_compra) || 0]));
    const nombres = new Map(productos.map((item) => [item.id, item]));
    const ventas = new Map<number, { qty: number; ingreso: number; costo: number }>();
    for (const factura of facturas) {
      if (factura.estado === 'anulada') {
        continue;
      }
      for (const item of factura.items || []) {
        const id = item.id_producto;
        const prev = ventas.get(id) || { qty: 0, ingreso: 0, costo: 0 };
        const qty = Number(item.cantidad) || 0;
        prev.qty += qty;
        prev.ingreso += Number(item.subtotal) || 0;
        prev.costo += qty * (costos.get(id) || 0);
        ventas.set(id, prev);
      }
    }
    if (reporte === 'rentabilidad') {
      const porCategoria = new Map<string, { ingreso: number; costo: number }>();
      for (const [id, venta] of ventas) {
        const categoria = nombres.get(id)?.categoria || 'Sin categoría';
        const prev = porCategoria.get(categoria) || { ingreso: 0, costo: 0 };
        prev.ingreso += venta.ingreso;
        prev.costo += venta.costo;
        porCategoria.set(categoria, prev);
      }
      this.columnas.set(['Categoría', 'Ingreso', 'Costo', 'Margen', 'Contribución']);
      const total = [...porCategoria.values()].reduce((acc, item) => acc + (item.ingreso - item.costo), 0) || 1;
      this.filas.set(
        [...porCategoria.entries()].map(([categoria, item]) => {
          const margen = item.ingreso - item.costo;
          return {
            c1: categoria,
            c2: this.quetzal(item.ingreso),
            c3: this.quetzal(item.costo),
            c4: this.quetzal(margen),
            c5: `${((margen / total) * 100).toFixed(1)} %`,
          };
        })
      );
      return;
    }
    this.columnas.set(['SKU', 'Producto', 'Unidades', 'Ingreso', 'Último precio']);
    this.filas.set(
      [...ventas.entries()].map(([id, venta]) => {
        const producto = nombres.get(id);
        return {
          c1: producto?.sku || String(id),
          c2: producto?.nombre || 'Producto',
          c3: String(venta.qty),
          c4: this.quetzal(venta.ingreso),
          c5: this.quetzal(venta.qty ? venta.ingreso / venta.qty : 0),
        };
      })
    );
  }

  private desdeKardex(rows: KardexMovimiento[], reporte: string): void {
    if (reporte === 'kardex') {
      this.columnas.set(['Fecha', 'Documento', 'Producto', 'Proceso', 'Cantidad']);
      this.filas.set(
        rows.map((row) => ({
          c1: String(row.fecha).slice(0, 10),
          c2: row.documento,
          c3: row.producto,
          c4: row.proceso,
          c5: String(row.cantidad),
        }))
      );
      return;
    }
    const acum = new Map<string, { entradas: number; salidas: number }>();
    for (const row of rows) {
      const prev = acum.get(row.producto) || { entradas: 0, salidas: 0 };
      if (row.cantidad >= 0) {
        prev.entradas += row.cantidad;
      } else {
        prev.salidas += Math.abs(row.cantidad);
      }
      acum.set(row.producto, prev);
    }
    this.columnas.set(['Producto', 'Entradas', 'Salidas', 'Neto', 'Movimientos']);
    this.filas.set(
      [...acum.entries()].map(([producto, item]) => ({
        c1: producto,
        c2: String(item.entradas),
        c3: String(item.salidas),
        c4: String(item.entradas - item.salidas),
        c5: String(rows.filter((row) => row.producto === producto).length),
      }))
    );
  }

  private reporteGeneral(productos: Producto[], facturas: Factura[], compras: Compra[]): void {
    const ventas = facturas.filter((item) => item.estado !== 'anulada').reduce((acc, item) => acc + Number(item.total || 0), 0);
    const iva = facturas.filter((item) => item.estado !== 'anulada').reduce((acc, item) => acc + Number(item.itbis || 0), 0);
    const egresos = compras.filter((item) => item.estado !== 'anulada').reduce((acc, item) => acc + Number(item.total || 0), 0);
    const stock = productos.reduce((acc, item) => acc + (Number(item.costo_compra) || 0) * (Number(item.stock_actual) || 0), 0);
    this.columnas.set(['Indicador', 'Detalle', 'Monto', 'Documentos', 'Moneda']);
    this.filas.set([
      { c1: 'Ventas', c2: 'Facturas no anuladas', c3: this.quetzal(ventas), c4: String(facturas.length), c5: 'GTQ' },
      { c1: 'IVA', c2: 'Impuesto de las ventas', c3: this.quetzal(iva), c4: '12 %', c5: 'GTQ' },
      { c1: 'Compras', c2: 'Egresos a proveedores', c3: this.quetzal(egresos), c4: String(compras.length), c5: 'GTQ' },
      { c1: 'Inventario', c2: 'Valor al costo', c3: this.quetzal(stock), c4: String(productos.length), c5: 'GTQ' },
    ]);
  }

  private valor(producto: Producto): number {
    return (Number(producto.costo_compra) || 0) * Math.max(0, Number(producto.stock_actual) || 0);
  }

  private payloadProducto(producto: Producto) {
    return {
      sku: producto.sku,
      nombre: producto.nombre,
      tipo: producto.tipo,
      categoria: producto.categoria,
      precio_venta: Number(producto.precio_venta) || 0,
      precio_2: Number(producto.precio_2) || 0,
      precio_3: Number(producto.precio_3) || 0,
      costo_compra: Number(producto.costo_compra) || 0,
      stock_minimo: producto.stock_minimo,
      id_proveedor: producto.id_proveedor,
      estado: producto.estado,
    };
  }

  private fallo(err: unknown, fallback: string): void {
    this.loading.set(false);
    this.errorMessage.set(apiErrorMessage(err, fallback));
  }
}
