import { Component, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-inventario-home',
  imports: [RouterLink, InventarioNav],
  templateUrl: './inventario-home.html',
  styleUrls: ['./inventario-shared.css', './inventario-home.css'],
})
export class InventarioHome implements OnInit {
  readonly stockBajo = computed(
    () =>
      this.inventario.productos().filter((item) => Number(item.stock_actual) <= Number(item.stock_minimo))
        .length
  );

  constructor(readonly inventario: InventarioService) {}

  ngOnInit(): void {
    this.inventario.cargarCatalogos().subscribe({ error: () => undefined });
  }
}
