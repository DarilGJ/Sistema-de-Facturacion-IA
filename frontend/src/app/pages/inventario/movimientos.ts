import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { clampPage, pageNumbers, pageRange, pageSlice } from '../../core/utils/paginate';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

@Component({
  selector: 'app-movimientos',
  imports: [InventarioNav, DatePipe, UiIcon],
  templateUrl: './movimientos.html',
  styleUrl: './inventario-shared.css',
})
export class Movimientos {
  readonly busqueda = signal('');
  readonly pagina = signal(1);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const lista = this.inventario.movimientos();
    if (!q) {
      return lista;
    }
    return lista.filter(
      (item) =>
        item.producto.toLowerCase().includes(q) ||
        item.almacen.toLowerCase().includes(q) ||
        item.referencia.toLowerCase().includes(q) ||
        item.tipo.toLowerCase().includes(q)
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

  etiqueta(tipo: 'entrada' | 'salida' | 'ajuste'): string {
    if (tipo === 'entrada') {
      return 'Entrada';
    }
    if (tipo === 'salida') {
      return 'Salida';
    }
    return 'Ajuste';
  }
}
