import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const SIDEBAR_KEY = 'sf_sidebar_collapsed';

type MenuKey =
  | 'receptores'
  | 'comprobantes'
  | 'facturas'
  | 'notas'
  | 'confirmaciones'
  | 'cotizaciones'
  | 'recurrente'
  | 'egresos'
  | 'compras'
  | 'gastos'
  | 'cuentas'
  | 'pos';

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
  readonly url = signal(this.router.url);

  readonly receptoresActivo = computed(
    () =>
      this.url().includes('/inventario/clientes') || this.url().includes('/inventario/proveedores')
  );
  readonly comprobantesActivo = computed(() => this.url().includes('/comprobantes/'));
  readonly facturasActivo = computed(() => this.url().includes('/comprobantes/facturas'));
  readonly notasActivo = computed(() => this.url().includes('/comprobantes/notas'));
  readonly cotizacionesActivo = computed(() => this.url().includes('/cotizaciones'));
  readonly confirmacionesActivo = computed(() => this.url().includes('/contabilidad'));
  readonly recurrenteActivo = computed(() => this.url().includes('/recurrentes'));
  readonly egresosActivo = computed(() => this.url().includes('/egresos/'));
  readonly comprasActivo = computed(() => this.url().includes('/egresos/compras'));
  readonly gastosActivo = computed(() => this.url().includes('/egresos/gastos'));
  readonly cuentasActivo = computed(() => this.url().includes('/cuentas/'));
  readonly posActivo = computed(
    () => this.url() === '/pos' || this.url().startsWith('/pos/')
  );

  readonly menuOpen = signal<Record<MenuKey, boolean>>({
    receptores: this.receptoresActivo(),
    comprobantes: this.comprobantesActivo(),
    facturas: this.facturasActivo(),
    notas: this.notasActivo(),
    confirmaciones: this.confirmacionesActivo(),
    cotizaciones: this.cotizacionesActivo(),
    recurrente: this.recurrenteActivo(),
    egresos: this.egresosActivo(),
    compras: this.comprasActivo(),
    gastos: this.gastosActivo(),
    cuentas: this.cuentasActivo(),
    pos: this.posActivo(),
  });

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
    { path: '/comprobantes/facturas', title: 'Listado de Facturas', text: 'Comprobantes' },
    { path: '/comprobantes/facturas/crear', title: 'Crear factura', text: 'Comprobantes' },
    { path: '/comprobantes/notas/credito', title: 'Nota Crédito', text: 'Comprobantes' },
    { path: '/comprobantes/notas/anulacion', title: 'Nota Anulación', text: 'Comprobantes' },
    { path: '/comprobantes/notas/debito', title: 'Nota Débito', text: 'Comprobantes' },
    { path: '/cotizaciones', title: 'Listado de Cotización', text: 'Cotizaciones' },
    { path: '/cotizaciones/crear', title: 'Crear cotización', text: 'Cotizaciones' },
    { path: '/recurrentes', title: 'Recurrentes', text: 'Comprobantes' },
    { path: '/egresos/compras', title: 'Compras', text: 'Egresos' },
    { path: '/egresos/gastos', title: 'Gastos', text: 'Egresos' },
    { path: '/anticipos', title: 'Anticipos', text: 'Comprobantes' },
    { path: '/cuentas/cobrar', title: 'Cuentas por cobrar', text: 'Cuentas' },
    { path: '/cuentas/pagar', title: 'Cuentas por pagar', text: 'Cuentas' },
    { path: '/pos', title: 'Punto de venta', text: 'POS' },
    { path: '/pos/cajas', title: 'Cajas registradoras', text: 'POS' },
    { path: '/pos/tiquetes', title: 'Listado tiquetes', text: 'POS' },
    { path: '/opciones/sat', title: 'Estado SAT', text: 'Opciones' },
    { path: '/opciones/calendario', title: 'Calendario', text: 'Opciones' },
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
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.url.set(event.urlAfterRedirects);
      this.abrirMenusActivos();
    });
  }

  abierto(menu: MenuKey): boolean {
    return this.menuOpen()[menu];
  }

  toggleMenu(menu: MenuKey, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuOpen.update((state) => ({ ...state, [menu]: !state[menu] }));
  }

  private abrirMenusActivos(): void {
    this.menuOpen.update((state) => ({
      ...state,
      receptores: state.receptores || this.receptoresActivo(),
      comprobantes: state.comprobantes || this.comprobantesActivo(),
      facturas: state.facturas || this.facturasActivo(),
      notas: state.notas || this.notasActivo(),
      confirmaciones: state.confirmaciones || this.confirmacionesActivo(),
      cotizaciones: state.cotizaciones || this.cotizacionesActivo(),
      recurrente: state.recurrente || this.recurrenteActivo(),
      egresos: state.egresos || this.egresosActivo(),
      compras: state.compras || this.comprasActivo(),
      gastos: state.gastos || this.gastosActivo(),
      cuentas: state.cuentas || this.cuentasActivo(),
      pos: state.pos || this.posActivo(),
    }));
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
