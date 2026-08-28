export interface DashboardTrendMetric {
  valor: number;
  trend?: number;
}

export interface DashboardOnboarding {
  id: string;
  titulo: string;
  listo: boolean;
  ruta: string;
}

export interface DashboardPlan {
  nombre: string;
  documentosLimite: number;
  ticketsLimite: number;
  documentosUsados: number;
  ticketsUsados: number;
  pagadoEl: string;
  venceEl: string;
}

export interface DashboardPos {
  periodo: string;
  desde: string;
  hasta: string;
  ventas: number;
  ventasTrend: number;
  utilidad: number;
  utilidadTrend: number;
  impuestos: number;
  impuestosTrend: number;
  productosVendidos: number;
  productosVendidosTrend: number;
  ticketPromedio: number;
  ticketPromedioTrend: number;
  margen: number;
  margenTrend: number;
  tickets: number;
  ticketsTrend: number;
  clientes: number;
  clientesTrend: number;
}

export interface DashboardResumen {
  generadoEn: string;
  empresa: string;
  plan: DashboardPlan;
  onboarding: DashboardOnboarding[];
  kpis: {
    ventasMes: number;
    ventasMesTrend: number;
    documentosMes: number;
    documentosMesTrend: number;
    ticketPromedio: number;
    ticketPromedioTrend: number;
    documentosAnio: number;
  };
  pos: DashboardPos;
  finanzas: {
    porCobrar: { total: number; vigente: number; vencido: number };
    porPagar: { total: number; vigente: number; vencido: number };
    devoluciones: { total: number; documentos: number };
    cobrado: number;
  };
  topProductos: Array<{ id_producto: number; concepto: string; items: number; total: number }>;
  ventasPorMes: Array<{ key: string; etiqueta: string; total: number; documentos: number }>;
  distribucion: Array<{ clave: string; etiqueta: string; valor: number }>;
  catalogo: {
    clientes: number;
    productos: number;
    servicios: number;
    proveedores: number;
    stockBajo: number;
  };
}

export interface DashboardAlerta {
  id: string;
  tipo: 'info' | 'alerta' | 'ok';
  texto: string;
  ruta: string;
}

export interface DashboardAlertas {
  total: number;
  items: DashboardAlerta[];
}
