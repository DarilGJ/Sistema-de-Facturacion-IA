import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InventarioService } from '../../core/services/inventario.service';
import { Producto, ProductoPayload, TipoArticulo } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

const UNIDADES_MEDIDA = [
  'unidad',
  'pieza',
  'unidad de servicio',
  'kilogramo',
  'gramo',
  'metro',
  'pulgada',
  'pie',
  'yarda',
  'millar',
  'centimetro',
  'galon',
  'caja',
  'kit',
  'bloque',
  'libra',
  'fardo',
  'onza',
  'docena',
];

const TIPOS_IMPUESTO = [
  { id: 'iva', nombre: 'Impuesto al Valor Agregado' },
  { id: 'idp', nombre: 'Impuesto sobre Derivados del Petróleo' },
  { id: 'turismo', nombre: 'Impuesto de Turismo - Hospedaje' },
  { id: 'timbre', nombre: 'Timbre' },
];

const IMPUESTOS = [
  { tipo: 'iva', nombre: 'IVA 12%', descripcion: 'Impuesto al valor agregado', porcentaje: 12 },
  { tipo: 'iva', nombre: 'Exento 0%', descripcion: 'Exento de IVA', porcentaje: 0 },
  { tipo: 'idp', nombre: 'IDP', descripcion: 'Impuesto sobre derivados del petróleo', porcentaje: 0 },
  { tipo: 'turismo', nombre: 'Turismo 10%', descripcion: 'Impuesto de turismo - hospedaje', porcentaje: 10 },
  { tipo: 'timbre', nombre: 'Timbre', descripcion: 'Timbre fiscal', porcentaje: 0 },
];

@Component({
  selector: 'app-productos',
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, UiIcon, RowMenu],
  templateUrl: './productos.html',
  styleUrl: './inventario-shared.css',
})
export class Productos implements OnInit {
  readonly busqueda = signal('');
  readonly filtroEstado = signal('activo');
  readonly filtroBodega = signal('');
  readonly filtroCategoria = signal('');
  readonly filtroSubcategoria = signal('');
  readonly filtroMarca = signal('');
  readonly filtroProveedor = signal('');
  readonly filtroCantidad = signal('');
  readonly filtrosOpen = signal(false);
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly unidades = UNIDADES_MEDIDA;
  readonly tiposImpuesto = TIPOS_IMPUESTO;
  readonly listasPrecio = ['P1', 'P2', 'P3'] as const;

  readonly categoriasFiltro = computed(() => {
    const fromCatalog = this.inventario.categorias().map((c) => c.nombre);
    const fromItems = this.inventario.productos().map((p) => p.categoria || '').filter(Boolean);
    return unique([...fromCatalog, ...fromItems]);
  });

  readonly subcategoriasFiltro = computed(() =>
    unique(this.inventario.productos().map((p) => p.subcategoria || '').filter(Boolean))
  );

  readonly marcasFiltro = computed(() => unique(this.inventario.productos().map((p) => p.marca || '').filter(Boolean)));

  readonly bodegasFiltro = computed(() => {
    const fromAlmacenes = this.inventario.almacenes().map((a) => a.nombre);
    const fromItems = this.inventario.productos().map((p) => p.bodega || '').filter(Boolean);
    return unique([...fromAlmacenes, ...fromItems]);
  });

  impuestosOpciones() {
    const tipo = this.form.controls.impuesto_tipo.value;
    return IMPUESTOS.filter((item) => !tipo || item.tipo === tipo);
  }

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    const bodega = this.filtroBodega();
    const categoria = this.filtroCategoria();
    const subcategoria = this.filtroSubcategoria();
    const marca = this.filtroMarca();
    const proveedor = this.filtroProveedor();
    const cantidad = this.filtroCantidad();
    return this.inventario.productos().filter((p) => {
      const matchQ =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q) ||
        (p.marca || '').toLowerCase().includes(q);
      const matchEstado = !estado || (estado === 'activo' ? p.estado : !p.estado);
      const matchBodega = !bodega || (p.bodega || '') === bodega;
      const matchCategoria = !categoria || (p.categoria || '') === categoria;
      const matchSub = !subcategoria || (p.subcategoria || '') === subcategoria;
      const matchMarca = !marca || (p.marca || '') === marca;
      const matchProveedor = !proveedor || String(p.id_proveedor || '') === proveedor;
      const matchCantidad =
        !cantidad ||
        (cantidad === 'bajo_minimo' && p.stock_actual <= p.stock_minimo) ||
        (cantidad === 'sin_stock' && p.stock_actual <= 0) ||
        (cantidad === 'con_stock' && p.stock_actual > 0);
      return (
        matchQ &&
        matchEstado &&
        matchBodega &&
        matchCategoria &&
        matchSub &&
        matchMarca &&
        matchProveedor &&
        matchCantidad
      );
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length, this.pageSize()));
  readonly montoInventario = computed(() =>
    this.filtrados().reduce((total, item) => total + this.valorCosto(item), 0)
  );

  readonly form;

  constructor(
    readonly inventario: InventarioService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      tipo: this.fb.nonNullable.control<TipoArticulo>('producto', Validators.required),
      sku: ['', Validators.required],
      nombre: ['', Validators.required],
      unidad_medida: ['unidad', Validators.required],
      detalle: [''],
      ubicacion: [''],
      impuesto_tipo: ['iva'],
      impuesto_nombre: ['IVA 12%'],
      impuesto_porcentaje: [12],
      costo_compra: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
      stock_reorden: [0],
      stock_maximo: [0],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      precio_2: [0],
      precio_3: [0],
      categoria: [''],
      subcategoria: [''],
      marca: [''],
      unidad_compra: ['unidad'],
      factor_conversion: [1],
      es_padre_variantes: [false],
      bodega: [''],
      stock_actual: [0, [Validators.required, Validators.min(0)]],
      id_proveedor: [null as number | null],
      estado: [true],
    });

    this.form.controls.impuesto_tipo.valueChanges.subscribe((tipo) => {
      const opciones = IMPUESTOS.filter((item) => item.tipo === tipo);
      const actual = this.form.controls.impuesto_nombre.value;
      if (!opciones.some((item) => item.nombre === actual)) {
        this.aplicarImpuesto(opciones[0]?.nombre || 'IVA 12%');
      }
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.formOpen() && !this.saving()) {
      this.cancelar();
    }
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    forkJoin({
      proveedores: this.inventario.listarProveedores(),
      productos: this.inventario.listarProductos(),
    }).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los productos.'));
      },
    });
  }

  defaults() {
    return {
      tipo: 'producto' as TipoArticulo,
      sku: '',
      nombre: '',
      unidad_medida: 'unidad',
      detalle: '',
      ubicacion: '',
      impuesto_tipo: 'iva',
      impuesto_nombre: 'IVA 12%',
      impuesto_porcentaje: 12,
      costo_compra: 0,
      stock_minimo: 0,
      stock_reorden: 0,
      stock_maximo: 0,
      precio_venta: 0,
      precio_2: 0,
      precio_3: 0,
      categoria: '',
      subcategoria: '',
      marca: '',
      unidad_compra: 'unidad',
      factor_conversion: 1,
      es_padre_variantes: false,
      bodega: '',
      stock_actual: 0,
      id_proveedor: null as number | null,
      estado: true,
    };
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form.reset(this.defaults());
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  abrirEditar(item: Producto): void {
    this.editingId.set(item.id);
    this.form.reset({
      tipo: this.esServicio(item) ? 'servicio' : 'producto',
      sku: item.sku,
      nombre: item.nombre,
      unidad_medida: item.unidad_medida || 'unidad',
      detalle: item.detalle ?? '',
      ubicacion: item.ubicacion ?? '',
      impuesto_tipo: item.impuesto_tipo || 'iva',
      impuesto_nombre: item.impuesto_nombre || 'IVA 12%',
      impuesto_porcentaje: Number(item.impuesto_porcentaje ?? 12),
      costo_compra: Number(item.costo_compra),
      stock_minimo: item.stock_minimo,
      stock_reorden: item.stock_reorden ?? 0,
      stock_maximo: item.stock_maximo ?? 0,
      precio_venta: Number(item.precio_venta),
      precio_2: Number(item.precio_2 || 0),
      precio_3: Number(item.precio_3 || 0),
      categoria: item.categoria ?? '',
      subcategoria: item.subcategoria ?? '',
      marca: item.marca ?? '',
      unidad_compra: item.unidad_compra || item.unidad_medida || 'unidad',
      factor_conversion: Number(item.factor_conversion || 1),
      es_padre_variantes: !!item.es_padre_variantes,
      bodega: item.bodega ?? '',
      stock_actual: item.stock_actual,
      id_proveedor: item.id_proveedor,
      estado: !!item.estado,
    });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  cancelar(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa código, nombre, unidad, costo y precios.');
      return;
    }

    const value = this.form.getRawValue();
    const payload: ProductoPayload = {
      sku: String(value.sku).trim(),
      nombre: String(value.nombre).trim(),
      tipo: value.tipo,
      detalle: value.detalle?.trim() || null,
      ubicacion: value.ubicacion?.trim() || null,
      unidad_medida: value.unidad_medida,
      categoria: value.categoria?.trim() || null,
      subcategoria: value.subcategoria?.trim() || null,
      marca: value.marca?.trim() || null,
      impuesto_tipo: value.impuesto_tipo || null,
      impuesto_nombre: value.impuesto_nombre || null,
      impuesto_porcentaje: Number(value.impuesto_porcentaje),
      precio_venta: Number(value.precio_venta),
      precio_2: Number(value.precio_2),
      precio_3: Number(value.precio_3),
      costo_compra: Number(value.costo_compra),
      stock_actual: Number(value.stock_actual),
      stock_minimo: Number(value.stock_minimo),
      stock_reorden: Number(value.stock_reorden),
      stock_maximo: Number(value.stock_maximo),
      unidad_compra: value.unidad_compra || null,
      factor_conversion: Number(value.factor_conversion || 1),
      es_padre_variantes: !!value.es_padre_variantes,
      bodega: value.bodega?.trim() || null,
      id_proveedor: value.id_proveedor ? Number(value.id_proveedor) : null,
      estado: !!value.estado,
    };

    this.saving.set(true);
    this.errorMessage.set('');

    const request = this.editingId()
      ? this.inventario.actualizarProducto(this.editingId()!, payload)
      : this.inventario.crearProducto(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editingId.set(null);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(err));
      },
    });
  }

  desactivar(item: Producto): void {
    if (!item.estado) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario.desactivarProducto(item.id).subscribe({
      next: () => this.saving.set(false),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(err));
      },
    });
  }

  aplicarImpuesto(nombre: string): void {
    const impuesto = IMPUESTOS.find((item) => item.nombre === nombre);
    if (!impuesto) {
      return;
    }
    this.form.patchValue({
      impuesto_tipo: impuesto.tipo,
      impuesto_nombre: impuesto.nombre,
      impuesto_porcentaje: impuesto.porcentaje,
    });
  }

  impuestoAplicado() {
    const nombre = this.form.controls.impuesto_nombre.value;
    const porcentaje = Number(this.form.controls.impuesto_porcentaje.value || 0);
    const found = IMPUESTOS.find((item) => item.nombre === nombre);
    return {
      nombre: nombre || 'IVA 12%',
      descripcion: found?.descripcion || 'Impuesto al valor agregado',
      porcentaje,
    };
  }

  tasa(): number {
    return Number(this.form.controls.impuesto_porcentaje.value || 0) / 100;
  }

  precioCon(lista: 'P1' | 'P2' | 'P3'): number {
    if (lista === 'P2') {
      return Number(this.form.controls.precio_2.value || 0);
    }
    if (lista === 'P3') {
      return Number(this.form.controls.precio_3.value || 0);
    }
    return Number(this.form.controls.precio_venta.value || 0);
  }

  precioSin(lista: 'P1' | 'P2' | 'P3'): number {
    const tasa = this.tasa();
    const con = this.precioCon(lista);
    return tasa > 0 ? con / (1 + tasa) : con;
  }

  setPrecioCon(lista: 'P1' | 'P2' | 'P3', value: string): void {
    const n = Math.max(0, Number(value) || 0);
    if (lista === 'P2') {
      this.form.controls.precio_2.setValue(n);
    } else if (lista === 'P3') {
      this.form.controls.precio_3.setValue(n);
    } else {
      this.form.controls.precio_venta.setValue(n);
    }
  }

  setPrecioSin(lista: 'P1' | 'P2' | 'P3', value: string): void {
    const n = Math.max(0, Number(value) || 0);
    const con = n * (1 + this.tasa());
    this.setPrecioCon(lista, String(con));
  }

  utilidadMonto(lista: 'P1' | 'P2' | 'P3'): number {
    return this.precioSin(lista) - Number(this.form.controls.costo_compra.value || 0);
  }

  utilidadPct(lista: 'P1' | 'P2' | 'P3'): number {
    const costo = Number(this.form.controls.costo_compra.value || 0);
    if (costo <= 0) {
      return 0;
    }
    return (this.utilidadMonto(lista) / costo) * 100;
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  setFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  toggleFiltros(): void {
    this.filtrosOpen.update((value) => !value);
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  requiredError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.hasError('required') && (control.touched || control.dirty);
  }

  valorCosto(item: Producto): number {
    return Number(item.costo_compra || 0) * Number(item.stock_actual || 0);
  }

  tipo(item: Producto): string {
    return this.esServicio(item) ? 'Servicio' : 'Producto';
  }

  esServicio(item: Producto): boolean {
    return item.tipo === 'servicio' || String(item.categoria || '').toLowerCase().includes('servicio');
  }

  gravamen(item: Producto): string {
    return Number(item.impuesto_porcentaje ?? 12) > 0 ? 'Gravado' : 'Exento';
  }

  unidad(item: Producto): string {
    return item.unidad_medida || 'unidad';
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  sinImpuesto(precio: number | string, porcentaje: number | string | undefined): number {
    const tasa = Number(porcentaje ?? 12) / 100;
    const n = Number(precio || 0);
    return tasa > 0 ? n / (1 + tasa) : n;
  }

  tituloModal(): string {
    const tipo = this.form.controls.tipo.value === 'servicio' ? 'Servicio' : 'Producto';
    return this.editingId() ? `Editar ${tipo}` : `Nuevo ${tipo}`;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es'));
}
