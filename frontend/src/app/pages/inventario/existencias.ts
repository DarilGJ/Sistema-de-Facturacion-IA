import { Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { Existencia, Producto } from '../../core/models/inventario.model';
import { apiErrorMessage } from '../../core/utils/api-error';
import { clampPage, compactPages, pageRange, pageSlice, PageToken } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

interface Asignacion {
  id: number | null;
  id_producto: number;
  sku: string;
  nombre: string;
  cantidad: number;
  persistido: boolean;
}

@Component({
  selector: 'app-existencias',
  imports: [InventarioNav, UiIcon],
  templateUrl: './existencias.html',
  styleUrls: ['./inventario-shared.css', './categorias.css', './existencias.css'],
})
export class Existencias implements OnInit {
  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly pageSize = signal(10);
  readonly bodegaId = signal<number | null>(null);
  readonly asignados = signal<Asignacion[]>([]);
  readonly loading = signal(false);
  readonly loadingAsignados = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly catalogo = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const asignados = new Set(this.asignados().map((item) => item.id_producto));
    return this.inventario.productos().filter((item) => {
      if (!item.estado || asignados.has(item.id)) {
        return false;
      }
      return (
        !q ||
        item.nombre.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  });

  readonly visibles = computed(() => pageSlice(this.catalogo(), this.pagina(), this.pageSize()));
  readonly paginas = computed(() => compactPages(this.pagina(), this.catalogo().length, this.pageSize()));
  readonly rango = computed(() => pageRange(this.catalogo().length, this.pagina(), this.pageSize()));
  readonly paginaActual = computed(() =>
    clampPage(this.pagina(), this.catalogo().length, this.pageSize())
  );
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(Math.max(this.catalogo().length, 0) / this.pageSize()))
  );

  readonly bodegaActual = computed(
    () => this.inventario.almacenes().find((item) => item.id === this.bodegaId()) || null
  );

  constructor(readonly inventario: InventarioService) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      productos: this.inventario.listarProductos(),
      bodegas: this.inventario.listarBodegas(),
    }).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudo cargar el catálogo.'));
      },
    });
  }

  seleccionarBodega(value: string): void {
    const id = Number(value) || null;
    this.bodegaId.set(id);
    this.asignados.set([]);
    this.errorMessage.set('');
    if (!id) {
      return;
    }
    this.loadingAsignados.set(true);
    this.inventario.listarExistencias(id).subscribe({
      next: (rows) => {
        this.asignados.set(rows.map((row) => this.toAsignacion(row, true)));
        this.loadingAsignados.set(false);
      },
      error: (err) => {
        this.loadingAsignados.set(false);
        this.errorMessage.set(apiErrorMessage(err, 'No se pudieron cargar las existencias.'));
      },
    });
  }

  agregar(producto: Producto): void {
    if (!this.bodegaId()) {
      this.errorMessage.set('Selecciona una bodega para asignar productos.');
      return;
    }
    if (this.asignados().some((item) => item.id_producto === producto.id)) {
      return;
    }
    this.asignados.update((lista) => [
      ...lista,
      {
        id: null,
        id_producto: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        cantidad: 0,
        persistido: false,
      },
    ]);
    this.errorMessage.set('');
  }

  quitar(item: Asignacion): void {
    if (item.persistido && item.cantidad > 0) {
      this.errorMessage.set(
        'Retira un producto de la bodega solo cuando su existencia sea 0. Si aún tiene unidades, registra un ajuste primero.'
      );
      return;
    }
    this.asignados.update((lista) => lista.filter((row) => row.id_producto !== item.id_producto));
  }

  setCantidad(item: Asignacion, value: string): void {
    if (item.persistido) {
      return;
    }
    const cantidad = Math.max(0, Math.trunc(Number(value) || 0));
    this.asignados.update((lista) =>
      lista.map((row) => (row.id_producto === item.id_producto ? { ...row, cantidad } : row))
    );
  }

  guardar(): void {
    const id = this.bodegaId();
    if (!id) {
      this.errorMessage.set('Selecciona una bodega.');
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.inventario
      .guardarExistencias(
        id,
        this.asignados().map((item) => ({ id_producto: item.id_producto, cantidad: item.cantidad }))
      )
      .subscribe({
        next: (rows) => {
          this.asignados.set(rows.map((row) => this.toAsignacion(row, true)));
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(apiErrorMessage(err, 'No se pudo guardar.'));
        },
      });
  }

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pagina.set(1);
  }

  irPagina(n: PageToken): void {
    if (n === 'gap') {
      return;
    }
    this.pagina.set(clampPage(n, this.catalogo().length, this.pageSize()));
  }

  private toAsignacion(row: Existencia, persistido: boolean): Asignacion {
    return {
      id: row.id,
      id_producto: row.id_producto,
      sku: row.sku,
      nombre: row.nombre,
      cantidad: row.cantidad,
      persistido,
    };
  }
}
