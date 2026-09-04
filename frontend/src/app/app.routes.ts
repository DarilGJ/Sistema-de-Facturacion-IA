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
      { path: 'pos', loadComponent: () => import('./pages/comprobantes/crear-factura').then((m) => m.CrearFactura), data: { modo: 'factura' } },
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
        path: 'inventario/subcategorias',
        loadComponent: () => import('./pages/inventario/subcategorias').then((m) => m.Subcategorias),
      },
      {
        path: 'inventario/marcas',
        loadComponent: () => import('./pages/inventario/marcas').then((m) => m.Marcas),
      },
      {
        path: 'inventario/listas-precios',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: {
          titulo: 'Listas de Precios',
          subtitulo: 'Define precios por lista, cliente o canal de venta.',
        },
      },
      {
        path: 'inventario/ajustes',
        loadComponent: () =>
          import('./pages/inventario/ajustes').then((m) => m.AjustesCantidad),
      },
      {
        path: 'inventario/traslados',
        loadComponent: () => import('./pages/inventario/traslados').then((m) => m.TrasladosInventario),
      },
      {
        path: 'inventario/toma-fisica',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: {
          titulo: 'Toma Física',
          subtitulo: 'Registra el conteo físico y concilia contra el stock del sistema.',
        },
      },
      {
        path: 'inventario/devoluciones',
        loadComponent: () =>
          import('./pages/inventario/devoluciones').then((m) => m.DevolucionesInventario),
      },
      {
        path: 'inventario/configuracion',
        loadComponent: () =>
          import('./pages/inventario/inventario-config').then((m) => m.InventarioConfigPage),
      },
      {
        path: 'inventario/reportes/alertas-stock',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: {
          titulo: 'Alertas de stock',
          subtitulo: 'Productos bajo mínimo o con existencias críticas.',
        },
      },
      {
        path: 'inventario/reportes/listado',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Listado de Inventario', subtitulo: 'Consulta general de artículos y existencias.' },
      },
      {
        path: 'inventario/reportes/existencias-margen',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: {
          titulo: 'Existencias y Margen',
          subtitulo: 'Stock actual junto al margen estimado por producto.',
        },
      },
      {
        path: 'inventario/reportes/valorizacion',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Valorización', subtitulo: 'Valor del inventario según costo y existencias.' },
      },
      {
        path: 'inventario/reportes/vencimientos',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Vencimientos', subtitulo: 'Lotes y productos próximos a vencer.' },
      },
      {
        path: 'inventario/reportes/kardex',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Kardex', subtitulo: 'Movimientos detallados por producto.' },
      },
      {
        path: 'inventario/reportes/historial-acumulado',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Historial Acumulado', subtitulo: 'Entradas y salidas acumuladas en el período.' },
      },
      {
        path: 'inventario/reportes/historico-ventas',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Histórico de Ventas', subtitulo: 'Unidades vendidas por producto y fecha.' },
      },
      {
        path: 'inventario/reportes/rentabilidad',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: {
          titulo: 'Rentabilidad por Categoría',
          subtitulo: 'Margen y contribución de cada categoría del catálogo.',
        },
      },
      {
        path: 'inventario/reportes/rotacion-abc',
        loadComponent: () =>
          import('./pages/inventario/inventario-placeholder').then((m) => m.InventarioPlaceholder),
        data: { titulo: 'Rotación (ABC)', subtitulo: 'Clasifica productos por rotación e importancia.' },
      },
      {
        path: 'comprobantes/facturas/crear',
        loadComponent: () =>
          import('./pages/comprobantes/crear-factura').then((m) => m.CrearFactura),
        data: { modo: 'factura' },
      },
      {
        path: 'comprobantes/facturas/:id',
        loadComponent: () =>
          import('./pages/comprobantes/seguimiento-factura').then((m) => m.SeguimientoFactura),
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
          import('./pages/comprobantes/crear-factura').then((m) => m.CrearFactura),
        data: { modo: 'cotizacion' },
      },
      {
        path: 'cotizaciones',
        loadComponent: () =>
          import('./pages/cotizaciones/listado-cotizaciones').then((m) => m.ListadoCotizaciones),
      },
      {
        path: 'recurrentes/crear',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Crear recurrente', subtitulo: 'Programa facturas o cobros que se repiten.' },
      },
      {
        path: 'recurrentes',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Listado de recurrentes', subtitulo: 'Consulta los documentos programados.' },
      },
      {
        path: 'egresos/compras/crear',
        loadComponent: () => import('./pages/egresos/crear-compra').then((m) => m.CrearCompra),
      },
      {
        path: 'egresos/compras',
        loadComponent: () => import('./pages/egresos/listado-compras').then((m) => m.ListadoCompras),
      },
      {
        path: 'egresos/gastos/tipos',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Gastos (Tipos)', subtitulo: 'Clasifica los tipos de gasto de la empresa.' },
      },
      {
        path: 'egresos/gastos/crear',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Crear gasto', subtitulo: 'Registra un gasto operativo.' },
      },
      {
        path: 'egresos/gastos',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Listado de gastos', subtitulo: 'Consulta los gastos registrados.' },
      },
      {
        path: 'anticipos',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Anticipos', subtitulo: 'Administra anticipos de clientes o proveedores.' },
      },
      {
        path: 'cuentas/cobrar',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Cuentas por cobrar', subtitulo: 'Saldos pendientes de tus clientes.' },
      },
      {
        path: 'cuentas/pagar',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Cuentas por pagar', subtitulo: 'Saldos pendientes con proveedores.' },
      },
      {
        path: 'pos/cajas',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Cajas registradoras', subtitulo: 'Apertura, cierre y control de cajas.' },
      },
      {
        path: 'pos/tiquetes',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Listado de tiquetes', subtitulo: 'Consulta los tiquetes emitidos en el POS.' },
      },
      {
        path: 'opciones/sat',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Estado SAT', subtitulo: 'Consulta el estado de tus documentos ante la autoridad fiscal.' },
      },
      {
        path: 'opciones/reportes',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Reportes', subtitulo: 'Reportes de ventas, inventario y cuentas.' },
      },
      {
        path: 'opciones/calendario',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Calendario', subtitulo: 'Vencimientos, cobros y actividades programadas.' },
      },
      {
        path: 'opciones/configuracion',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Configuraciones', subtitulo: 'Empresa, usuarios, sucursales y preferencias.' },
      },
      {
        path: 'opciones/soporte',
        loadComponent: () => import('./pages/modulo/modulo-placeholder').then((m) => m.ModuloPlaceholder),
        data: { titulo: 'Soporte técnico', subtitulo: 'Ayuda, contacto y estado del sistema.' },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
