import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-productos',
  imports: [InventarioNav, CurrencyPipe],
  templateUrl: './productos.html',
  styleUrl: './inventario-shared.css',
})
export class Productos {
  readonly busqueda = signal('');

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
        p.categoria.toLowerCase().includes(q)
    );
  });

  constructor(readonly inventario: InventarioService) {}
}
