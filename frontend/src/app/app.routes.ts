import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'home', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'pos', loadComponent: () => import('./pages/pos/pos').then((m) => m.Pos) },
      {
        path: 'contabilidad',
        loadComponent: () => import('./pages/contabilidad/contabilidad').then((m) => m.Contabilidad),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./pages/inventario/inventario-home').then((m) => m.InventarioHome),
      },
      {
        path: 'inventario/productos',
        loadComponent: () => import('./pages/inventario/productos').then((m) => m.Productos),
      },
      {
        path: 'inventario/categorias',
        loadComponent: () => import('./pages/inventario/categorias').then((m) => m.Categorias),
      },
      {
        path: 'inventario/almacenes',
        loadComponent: () => import('./pages/inventario/almacenes').then((m) => m.Almacenes),
      },
      {
        path: 'inventario/existencias',
        loadComponent: () => import('./pages/inventario/existencias').then((m) => m.Existencias),
      },
      {
        path: 'inventario/movimientos',
        loadComponent: () => import('./pages/inventario/movimientos').then((m) => m.Movimientos),
      },
      {
        path: 'inventario/proveedores',
        loadComponent: () => import('./pages/inventario/proveedores').then((m) => m.Proveedores),
      },
      { path: 'inventario/clientes', loadComponent: () => import('./pages/inventario/clientes').then((m) => m.Clientes) },
      {
        path: 'comprobantes/facturas/crear',
        loadComponent: () => import('./pages/pos/pos').then((m) => m.Pos),
      },
      {
        path: 'comprobantes/facturas',
        loadComponent: () =>
          import('./pages/comprobantes/listado-comprobantes').then((m) => m.ListadoComprobantes),
        data: {
          modo: 'factura',
          titulo: 'Listado de Facturas',
          subtitulo: 'Consulta, filtra y gestiona tus documentos.',
        },
      },
      {
        path: 'comprobantes/notas/credito',
        loadComponent: () =>
          import('./pages/comprobantes/listado-comprobantes').then((m) => m.ListadoComprobantes),
        data: {
          modo: 'nc',
          titulo: 'Listado Nota Crédito',
          subtitulo: 'Consulta y gestiona tus notas de crédito.',
        },
      },
      {
        path: 'comprobantes/notas/anulacion',
        loadComponent: () =>
          import('./pages/comprobantes/listado-comprobantes').then((m) => m.ListadoComprobantes),
        data: {
          modo: 'anulacion',
          titulo: 'Listado Nota Anulación',
          subtitulo: 'Consulta las facturas anuladas.',
        },
      },
      {
        path: 'comprobantes/notas/debito',
        loadComponent: () =>
          import('./pages/comprobantes/listado-comprobantes').then((m) => m.ListadoComprobantes),
        data: {
          modo: 'nd',
          titulo: 'Listado Nota Débito',
          subtitulo: 'Consulta y gestiona tus notas de débito.',
        },
      },
      {
        path: 'cotizaciones/crear',
        loadComponent: () =>
          import('./pages/cotizaciones/crear-cotizacion').then((m) => m.CrearCotizacion),
      },
      {
        path: 'cotizaciones',
        loadComponent: () =>
          import('./pages/cotizaciones/listado-cotizaciones').then((m) => m.ListadoCotizaciones),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
