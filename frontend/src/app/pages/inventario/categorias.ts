import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { Categoria } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';
import { RowMenu } from '../../shared/row-menu/row-menu';

@Component({
  selector: 'app-categorias',
  imports: [InventarioNav, UiIcon, ReactiveFormsModule, RowMenu],
  templateUrl: './categorias.html',
  styleUrls: ['./inventario-shared.css', './categorias.css'],
})
export class Categorias implements OnInit {
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly filtroEstado = signal('activo');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly formOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly accionesOpen = signal(false);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    return this.inventario.categorias().filter((item) => {
      const matchQ =
        !q ||
        item.nombre.toLowerCase().includes(q) ||
        (item.descripcion || '').toLowerCase().includes(q);
      const matchEstado = !estado || (estado === 'activo' ? item.estado : !item.estado);
      return matchQ && matchEstado;
    });
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() =>
    clampPage(this.pagina(), this.filtrados().length, this.pageSize())
  );

  readonly form;

  constructor(
    readonly inventario: InventarioService,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      nombre: this.fb.nonNullable.control('', Validators.required),
      descripcion: this.fb.nonNullable.control(''),
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  @HostListener('document:click')
  closeAcciones(): void {
    this.accionesOpen.set(false);
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
    this.inventario.listarCategorias().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar las categorías.'));
      },
    });
  }

  abrirNuevo(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  abrirEditar(item: Categoria): void {
    this.editingId.set(item.id);
    this.form.reset({ nombre: item.nombre, descripcion: item.descripcion || '' });
    this.errorMessage.set('');
    this.formOpen.set(true);
  }

  cancelar(): void {
    if (this.saving()) {
      return;
    }
    this.formOpen.set(false);
    this.editingId.set(null);
    this.errorMessage.set('');
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      nombre: value.nombre.trim(),
      descripcion: value.descripcion?.trim() || null,
    };
    this.saving.set(true);
    this.errorMessage.set('');
    const request = this.editingId()
      ? this.inventario.actualizarCategoria(this.editingId()!, payload)
      : this.inventario.crearCategoria(payload);
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

  cambiarEstado(item: Categoria): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario.actualizarCategoria(item.id, { estado: !item.estado }).subscribe({
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

  setFiltroEstado(value: string): void {
    this.filtroEstado.set(value);
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  irPagina(n: number): void {
    this.pagina.set(clampPage(n, this.filtrados().length, this.pageSize()));
  }

  toggleAcciones(event: Event): void {
    event.stopPropagation();
    this.accionesOpen.update((open) => !open);
  }
}
