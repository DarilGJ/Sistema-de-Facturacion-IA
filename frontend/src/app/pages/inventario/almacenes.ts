import { Component, computed, signal } from '@angular/core';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

@Component({
  selector: 'app-almacenes',
  imports: [InventarioNav, UiIcon],
  templateUrl: './almacenes.html',
  styleUrl: './inventario-shared.css',
})
export class Almacenes {
  readonly busqueda = signal('');
  readonly pagina = signal(1);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.inventario.almacenes();
    if (!q) {
      return lista;
    }
    return lista.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.ubicacion.toLowerCase().includes(q) ||
        item.responsable.toLowerCase().includes(q)
    );
  });

  readonly visibles = computed(() => pageSlice(this.filtrados(), this.pagina()));
  readonly paginas = computed(() => pageNumbers(this.filtrados().length));
  readonly rango = computed(() => pageRange(this.filtrados().length, this.pagina()));
  readonly paginaActual = computed(() => clampPage(this.pagina(), this.filtrados().length));

  constructor(readonly inventario: InventarioService) {}

  setBusqueda(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
  }
}
