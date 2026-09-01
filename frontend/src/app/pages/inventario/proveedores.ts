import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { Proveedor } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

@Component({
  selector: 'app-proveedores',
  imports: [ReactiveFormsModule, UiIcon, RowMenu],
  templateUrl: './proveedores.html',
  styleUrl: './inventario-shared.css',
})
export class Proveedores implements OnInit {
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly accionesOpen = signal(false);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.inventario.proveedores();
    if (!q) {
      return lista;
    }
    return lista.filter(
      (p) =>
        p.nombre_comercial.toLowerCase().includes(q) ||
        (p.contacto || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
    );
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length));

  readonly form;

  constructor(
    readonly inventario: InventarioService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre_comercial: ['', Validators.required],
      contacto: [''],
      telefono: [''],
      email: ['', Validators.email],
      tiempo_entrega_dias: [1, [Validators.required, Validators.min(0)]],
      estado: [true],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  @HostListener('document:click')
  closeAcciones(): void {
    this.accionesOpen.set(false);
  }

  cargar(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.inventario.listarProveedores().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los proveedores.'));
      },
    });
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre_comercial: '',
      contacto: '',
      telefono: '',
      email: '',
      tiempo_entrega_dias: 1,
      estado: true,
    });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  abrirEditar(item: Proveedor): void {
    this.editingId.set(item.id);
    this.form.reset({
      nombre_comercial: item.nombre_comercial,
      contacto: item.contacto ?? '',
      telefono: item.telefono ?? '',
      email: item.email ?? '',
      tiempo_entrega_dias: item.tiempo_entrega_dias,
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
      this.errorMessage.set('Completa los campos obligatorios.');
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      nombre_comercial: String(value.nombre_comercial).trim(),
      contacto: value.contacto?.trim() || null,
      telefono: value.telefono?.trim() || null,
      email: value.email?.trim() || null,
      tiempo_entrega_dias: Number(value.tiempo_entrega_dias),
      estado: !!value.estado,
    };

    this.saving.set(true);
    this.errorMessage.set('');

    const request = this.editingId()
      ? this.inventario.actualizarProveedor(this.editingId()!, payload)
      : this.inventario.crearProveedor(payload);

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

  desactivar(item: Proveedor): void {
    if (!item.estado) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario.desactivarProveedor(item.id).subscribe({
      next: () => this.saving.set(false),
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(err));
      },
    });
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  toggleAcciones(event: Event): void {
    event.stopPropagation();
    this.accionesOpen.update((open) => !open);
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
}
