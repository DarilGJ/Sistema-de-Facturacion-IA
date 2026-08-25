import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-inventario-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './inventario-nav.html',
  styleUrl: './inventario-nav.css',
})
export class InventarioNav {
  readonly links = [
    { path: '/inventario', label: 'Resumen', exact: true },
    { path: '/inventario/productos', label: 'Productos', exact: false },
    { path: '/inventario/categorias', label: 'Categorías', exact: false },
    { path: '/inventario/almacenes', label: 'Almacenes', exact: false },
    { path: '/inventario/existencias', label: 'Existencias', exact: false },
    { path: '/inventario/movimientos', label: 'Movimientos', exact: false },
    { path: '/inventario/proveedores', label: 'Proveedores', exact: false },
    { path: '/inventario/clientes', label: 'Clientes', exact: false },
  ];
}
