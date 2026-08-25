import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-productos',
  imports: [InventarioNav, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './productos.html',
  styleUrl: './inventario-shared.css',
})
export class Productos implements OnInit {
  readonly busqueda = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.inventario.productos();
    if (!q) {
      return lista;
    }
    return lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q)
    );
  });

  readonly form;

  constructor(
    readonly inventario: InventarioService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      sku: ['', Validators.required],
      nombre: ['', Validators.required],
      categoria: [''],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      costo_compra: [0, [Validators.required, Validators.min(0)]],
      stock_actual: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
      id_proveedor: [null as number | null],
      estado: [true],
    });
  }

  ngOnInit(): void {
    this.cargar();
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

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form.reset({
      sku: '',
      nombre: '',
      categoria: '',
      precio_venta: 0,
      costo_compra: 0,
      stock_actual: 0,
      stock_minimo: 0,
      id_proveedor: null,
      estado: true,
    });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  abrirEditar(item: Producto): void {
    this.editingId.set(item.id);
    this.form.reset({
      sku: item.sku,
      nombre: item.nombre,
      categoria: item.categoria ?? '',
      precio_venta: Number(item.precio_venta),
      costo_compra: Number(item.costo_compra),
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
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
      this.errorMessage.set('Completa SKU, nombre, precio de venta y costo de compra.');
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      sku: String(value.sku).trim(),
      nombre: String(value.nombre).trim(),
      categoria: value.categoria?.trim() || null,
      precio_venta: Number(value.precio_venta),
      costo_compra: Number(value.costo_compra),
      stock_actual: Number(value.stock_actual),
      stock_minimo: Number(value.stock_minimo),
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
}
