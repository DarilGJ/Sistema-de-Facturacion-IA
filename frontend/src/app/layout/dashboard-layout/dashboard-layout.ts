import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const SIDEBAR_KEY = 'sf_sidebar_collapsed';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UiIcon],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly dashboardApi = inject(DashboardService);

  readonly sidebarOpen = signal(false);
  readonly sidebarCollapsed = signal(localStorage.getItem(SIDEBAR_KEY) === '1');
  readonly modulosOpen = signal(false);
  readonly notificacionesOpen = signal(false);
  readonly busqueda = signal('');

  readonly inventarioLinks = [
    { path: '/inventario', label: 'Resumen', exact: true, icon: 'box' },
    { path: '/inventario/productos', label: 'Artículos / Servicios', exact: false, icon: 'tag' },
    { path: '/inventario/categorias', label: 'Categorías', exact: false, icon: 'layers' },
    { path: '/inventario/almacenes', label: 'Almacenes', exact: false, icon: 'warehouse' },
    { path: '/inventario/existencias', label: 'Existencias', exact: false, icon: 'layers' },
    { path: '/inventario/movimientos', label: 'Movimientos', exact: false, icon: 'swap' },
    { path: '/inventario/proveedores', label: 'Proveedores', exact: false, icon: 'truck' },
    { path: '/inventario/clientes', label: 'Clientes', exact: false, icon: 'users' },
  ];

  readonly modulos = [
    { path: '/pos', title: 'POS', text: 'Punto de venta y generación de facturas.' },
    { path: '/contabilidad', title: 'Contabilidad', text: 'Libros, ITBIS y cuentas por cobrar.' },
    { path: '/inventario', title: 'Inventario', text: 'Productos, stock, proveedores y clientes.' },
  ];

  readonly searchable = [
    { path: '/dashboard', title: 'Inicio', text: 'Dashboard operativo' },
    ...this.modulos,
    ...this.inventarioLinks.map((link) => ({ path: link.path, title: link.label, text: 'Inventario' })),
  ];

  readonly resultados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) {
      return [];
    }
    return this.searchable.filter(
      (item) => item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.dashboardApi.cargarAlertas().subscribe({ error: () => undefined });
  }

  @HostListener('document:click')
  closePopovers(): void {
    this.modulosOpen.set(false);
    this.notificacionesOpen.set(false);
  }

  toggleSidebar(): void {
    if (window.innerWidth <= 900) {
      this.sidebarOpen.update((open) => !open);
      return;
    }
    this.sidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      return next;
    });
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleModulos(event: Event): void {
    event.stopPropagation();
    this.notificacionesOpen.set(false);
    this.modulosOpen.update((open) => !open);
  }

  toggleNotificaciones(event: Event): void {
    event.stopPropagation();
    this.modulosOpen.set(false);
    this.notificacionesOpen.update((open) => !open);
  }

  irAModulo(path: string, event: Event): void {
    event.stopPropagation();
    this.modulosOpen.set(false);
    this.closeSidebar();
    void this.router.navigate([path]);
  }

  irABusqueda(path: string, event?: Event): void {
    event?.stopPropagation();
    this.busqueda.set('');
    this.closeSidebar();
    void this.router.navigate([path]);
  }

  onSearchEnter(): void {
    const first = this.resultados()[0];
    if (first) {
      this.irABusqueda(first.path);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
