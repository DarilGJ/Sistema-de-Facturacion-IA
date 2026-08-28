import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { UiIcon } from '../../shared/ui-icon/ui-icon';

const POLAR_COLORS = ['#f97316', '#0f766e', '#1d4ed8', '#eab308', '#db2777', '#64748b', '#22c55e', '#7c3aed'];

@Component({
  selector: 'app-inventario-home',
  imports: [RouterLink, InventarioNav, UiIcon],
  templateUrl: './inventario-home.html',
  styleUrls: ['./inventario-shared.css', './inventario-home.css'],
})
export class InventarioHome implements OnInit {
  private readonly dashboardApi = inject(DashboardService);
  readonly inventario = inject(InventarioService);

  readonly vista = signal<'estadistica' | 'auditoria'>('estadistica');
  readonly fuenteVentas = signal<'factura' | 'tiquete'>('factura');
  readonly fuenteCompras = signal<'compras' | 'confirmar'>('compras');

  readonly productosActivos = computed(
    () => this.inventario.productos().filter((item) => item.estado).length
  );

  readonly stockBajo = computed(
    () =>
      this.inventario
        .productos()
        .filter((item) => item.estado && Number(item.stock_actual) <= Number(item.stock_minimo)).length
  );

  readonly valorInventario = computed(() =>
    this.inventario
      .productos()
      .reduce((sum, item) => sum + Number(item.stock_actual) * Number(item.costo_compra), 0)
  );

  readonly topVendidos = computed(() => this.dashboardApi.resumen()?.topProductos ?? []);

  readonly topComprados = computed(() =>
    [...this.inventario.productos()]
      .filter((item) => item.estado)
      .sort((a, b) => Number(b.costo_compra) * Number(b.stock_minimo) - Number(a.costo_compra) * Number(a.stock_minimo))
      .slice(0, 10)
      .map((item) => ({
        concepto: item.nombre,
        items: item.stock_minimo,
        total: Number(item.costo_compra) * Math.max(item.stock_minimo, 1),
      }))
  );

  readonly polarVentas = computed(() => this.buildPolar(this.topVendidos()));
  readonly polarCompras = computed(() => this.buildPolar(this.topComprados()));

  ngOnInit(): void {
    forkJoin({
      catalogos: this.inventario.cargarCatalogos(),
      dashboard: this.dashboardApi.cargar('mes'),
    }).subscribe({ error: () => undefined });
  }

  moneda(valor: number): string {
    return `RD$ ${valor.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  setVista(vista: 'estadistica' | 'auditoria'): void {
    this.vista.set(vista);
  }

  private buildPolar(
    rows: Array<{ concepto: string; items: number; total: number }>
  ): Array<{ concepto: string; total: number; items: number; path: string; color: string }> {
    const items = rows.slice(0, 8);
    if (!items.length) {
      return [];
    }
    const max = Math.max(...items.map((row) => row.total), 1);
    const slice = 360 / items.length;
    const cx = 90;
    const cy = 90;
    return items.map((row, i) => {
      const r = 28 + (row.total / max) * 52;
      const start = i * slice - 90;
      const end = start + slice;
      return {
        ...row,
        color: POLAR_COLORS[i % POLAR_COLORS.length],
        path: this.wedge(cx, cy, r, start, end),
      };
    });
  }

  private wedge(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
    const start = this.polar(cx, cy, r, startDeg);
    const end = this.polar(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
  }

  private polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
}
