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
    ],
  },
  { path: '**', redirectTo: 'login' },
];
