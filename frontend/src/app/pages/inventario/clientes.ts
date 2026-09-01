import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService } from '../../core/services/inventario.service';
import { Cliente } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, UiIcon, RowMenu],
  templateUrl: './clientes.html',
  styleUrl: './inventario-shared.css',
})
export class Clientes implements OnInit {
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
    const lista = this.inventario.clientes();
    if (!q) {
      return lista;
    }
    return lista.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
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
      nombre: ['', Validators.required],
      nit: ['', Validators.required],
      email: ['', Validators.email],
      telefono: [''],
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
    this.inventario.listarClientes().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar los clientes.'));
      },
    });
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre: '',
      nit: '',
      email: '',
      telefono: '',
      estado: true,
    });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  abrirEditar(item: Cliente): void {
    this.editingId.set(item.id);
    this.form.reset({
      nombre: item.nombre,
      nit: item.nit,
      email: item.email ?? '',
      telefono: item.telefono ?? '',
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
      this.errorMessage.set('Completa nombre y NIT.');
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      nombre: String(value.nombre).trim(),
      nit: String(value.nit).trim(),
      email: value.email?.trim() || null,
      telefono: value.telefono?.trim() || null,
      estado: !!value.estado,
    };

    this.saving.set(true);
    this.errorMessage.set('');

    const request = this.editingId()
      ? this.inventario.actualizarCliente(this.editingId()!, payload)
      : this.inventario.crearCliente(payload);

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

  desactivar(item: Cliente): void {
    if (!item.estado) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario.desactivarCliente(item.id).subscribe({
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
