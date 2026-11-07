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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'listas',
          inventario: true,
          titulo: 'Listas de Precios',
          subtitulo: 'Actualiza el precio de venta y las listas 2 y 3 de cada producto.',
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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'toma',
          inventario: true,
          titulo: 'Toma Física',
          subtitulo: 'Compara el conteo con el stock del sistema y genera el ajuste.',
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
          import('./pages/inventario/pedido-sugerido').then((m) => m.PedidoSugeridoPage),
      },
      {
        path: 'inventario/reportes/listado',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'listado',
          inventario: true,
          titulo: 'Listado de Inventario',
          subtitulo: 'Consulta general de artículos y existencias.',
        },
      },
      {
        path: 'inventario/reportes/existencias-margen',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'margen',
          inventario: true,
          titulo: 'Existencias y Margen',
          subtitulo: 'Precio, costo y margen estimado por producto.',
        },
      },
      {
        path: 'inventario/reportes/valorizacion',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'valorizacion',
          inventario: true,
          titulo: 'Valorización',
          subtitulo: 'Valor del inventario según costo y existencias.',
        },
      },
      {
        path: 'inventario/reportes/vencimientos',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'vencimientos',
          inventario: true,
          titulo: 'Vencimientos',
          subtitulo: 'Productos del catálogo y su fecha de lote, cuando existe.',
        },
      },
      {
        path: 'inventario/reportes/kardex',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'kardex',
          inventario: true,
          titulo: 'Kardex',
          subtitulo: 'Movimientos detallados por producto.',
        },
      },
      {
        path: 'inventario/reportes/historial-acumulado',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'historial',
          inventario: true,
          titulo: 'Historial Acumulado',
          subtitulo: 'Entradas y salidas acumuladas por producto.',
        },
      },
      {
        path: 'inventario/reportes/historico-ventas',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'ventas',
          inventario: true,
          titulo: 'Histórico de Ventas',
          subtitulo: 'Unidades vendidas por producto.',
        },
      },
      {
        path: 'inventario/reportes/rentabilidad',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'rentabilidad',
          inventario: true,
          titulo: 'Rentabilidad por Categoría',
          subtitulo: 'Margen y contribución de cada categoría a partir de las ventas.',
        },
      },
      {
        path: 'inventario/reportes/rotacion-abc',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'reporte',
          reporte: 'abc',
          inventario: true,
          titulo: 'Rotación (ABC)',
          subtitulo: 'Clasifica el inventario por valor acumulado.',
        },
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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'notas',
          notas: 'credito',
          titulo: 'Listado Nota Crédito',
          subtitulo: 'Notas generadas por las devoluciones de venta.',
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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: {
          kind: 'notas',
          notas: 'debito',
          tipo: 'nota_debito',
          titulo: 'Listado Nota Débito',
          subtitulo: 'Cargos adicionales registrados contra una factura.',
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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'recurrente', titulo: 'Crear recurrente', subtitulo: 'Programa facturas o cobros que se repiten.' },
      },
      {
        path: 'recurrentes',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'recurrente', titulo: 'Listado de recurrentes', subtitulo: 'Consulta los documentos programados.' },
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
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'gasto_tipo', titulo: 'Gastos (Tipos)', subtitulo: 'Clasifica los tipos de gasto de la empresa.' },
      },
      {
        path: 'egresos/gastos/crear',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'gasto', titulo: 'Crear gasto', subtitulo: 'Registra un gasto operativo.' },
      },
      {
        path: 'egresos/gastos',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'gasto', titulo: 'Listado de gastos', subtitulo: 'Consulta los gastos registrados.' },
      },
      {
        path: 'anticipos',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'anticipo', titulo: 'Anticipos', subtitulo: 'Administra anticipos de clientes o proveedores.' },
      },
      {
        path: 'cuentas/cobrar',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'cuentas', tipo: 'cobrar', titulo: 'Cuentas por cobrar', subtitulo: 'Saldos pendientes de tus clientes.' },
      },
      {
        path: 'cuentas/pagar',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'cuentas', tipo: 'pagar', titulo: 'Cuentas por pagar', subtitulo: 'Saldos pendientes con proveedores.' },
      },
      {
        path: 'pos/cajas',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'registro', tipo: 'caja', titulo: 'Cajas registradoras', subtitulo: 'Apertura, cierre y control de cajas.' },
      },
      { path: 'pos/tiquetes', redirectTo: 'comprobantes/facturas', pathMatch: 'full' },
      {
        path: 'opciones/sat',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'sat', titulo: 'Estado SAT', subtitulo: 'La autorización sale solo de la API del certificador FEL.' },
      },
      {
        path: 'opciones/reportes',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'reporte', reporte: 'general', titulo: 'Reportes', subtitulo: 'Ventas, IVA, compras e inventario.' },
      },
      {
        path: 'opciones/calendario',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'calendario', titulo: 'Calendario', subtitulo: 'Cobros y pagos pendientes.' },
      },
      {
        path: 'opciones/configuracion',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'config', titulo: 'Configuraciones', subtitulo: 'Datos de la empresa emisora.' },
      },
      {
        path: 'opciones/soporte',
        loadComponent: () => import('./pages/operacion/operacion').then((m) => m.Operacion),
        data: { kind: 'soporte', titulo: 'Soporte técnico', subtitulo: 'Salud de la API y estado de la conexión FEL.' },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
