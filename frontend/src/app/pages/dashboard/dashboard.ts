import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly modules = [
    {
      path: '/inventario',
      title: 'Inventario',
      text: 'Resumen de stock, almacenes y reposición.',
    },
    {
      path: '/inventario/productos',
      title: 'Productos',
      text: 'Catálogo con SKU, precios y categorías.',
    },
    {
      path: '/inventario/proveedores',
      title: 'Proveedores',
      text: 'Altas y tiempos de entrega para reposición.',
    },
    {
      path: '/inventario/clientes',
      title: 'Clientes',
      text: 'Catálogo de clientes con NIT único.',
    },
    {
      path: '/inventario/existencias',
      title: 'Existencias',
      text: 'Cantidades actuales y alertas de mínimo.',
    },
    {
      path: '/inventario/movimientos',
      title: 'Movimientos',
      text: 'Entradas, salidas y ajustes de inventario.',
    },
  ];
}
