import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  readonly sidebarOpen = signal(false);

  readonly inventarioLinks = [
    { path: '/inventario', label: 'Resumen', exact: true },
    { path: '/inventario/productos', label: 'Productos', exact: false },
    { path: '/inventario/categorias', label: 'Categorías', exact: false },
    { path: '/inventario/almacenes', label: 'Almacenes', exact: false },
    { path: '/inventario/existencias', label: 'Existencias', exact: false },
    { path: '/inventario/movimientos', label: 'Movimientos', exact: false },
    { path: '/inventario/proveedores', label: 'Proveedores', exact: false },
  ];

  constructor(readonly auth: AuthService) {}

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
