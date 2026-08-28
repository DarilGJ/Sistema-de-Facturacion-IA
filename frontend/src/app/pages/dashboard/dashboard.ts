import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardPeriodo } from '../../core/services/dashboard.service';
import { DashboardResumen } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly dashboardApi = inject(DashboardService);
  readonly auth = inject(AuthService);

  readonly periodo = signal<DashboardPeriodo>('mes');
  readonly desde = signal(this.toInputDate(this.startOfMonth(new Date())));
  readonly hasta = signal(this.toInputDate(new Date()));
  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = computed(() => this.dashboardApi.resumen());

  readonly anioActual = new Date().getFullYear();
  readonly fechaLarga = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  readonly onboardingListos = computed(() => {
    const items = this.data()?.onboarding ?? [];
    return items.filter((item) => item.listo).length;
  });

  readonly ventasChart = computed(() => this.buildAreaChart(this.data()?.ventasPorMes ?? []));
  readonly donut = computed(() => this.buildDonut(this.data()?.distribucion ?? []));

  ngOnInit(): void {
    this.cargar();
  }

  setPeriodo(periodo: DashboardPeriodo): void {
    this.periodo.set(periodo);
    if (periodo !== 'rango') {
      this.cargar();
    }
  }

  aplicarRango(): void {
    this.periodo.set('rango');
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    const periodo = this.periodo();
    this.dashboardApi
      .cargar(periodo, this.desde(), this.hasta())
      .subscribe({
        next: () => this.loading.set(false),
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || 'No se pudo cargar el dashboard');
        },
      });
  }

  moneda(valor: number | undefined): string {
    return `RD$ ${(Number(valor) || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  entero(valor: number | undefined): string {
    return (Number(valor) || 0).toLocaleString('es-DO');
  }

  porcentaje(valor: number | undefined): string {
    const n = Number(valor) || 0;
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toLocaleString('es-DO', { maximumFractionDigits: 1 })}%`;
  }

  fechaCorta(iso: string | undefined): string {
    if (!iso) {
      return '—';
    }
    return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(
      new Date(iso)
    );
  }

  uso(usados: number, limite: number): number {
    if (!limite) {
      return 0;
    }
    return Math.min(100, Math.round((usados / limite) * 100));
  }

  saludo(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Buenos días';
    }
    if (hour < 19) {
      return 'Buenas tardes';
    }
    return 'Buenas noches';
  }

  private toInputDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private buildAreaChart(series: DashboardResumen['ventasPorMes']) {
    const w = 640;
    const h = 220;
    const padX = 18;
    const padY = 22;
    const max = Math.max(...series.map((row) => row.total), 1);
    const last = series.at(-1)?.total ?? 0;

    if (!series.length) {
      return { w, h, line: '', area: '', points: [] as Array<{ x: number; y: number; etiqueta: string; total: number }>, last, max };
    }

    const points = series.map((row, i) => {
      const x = padX + (i / Math.max(series.length - 1, 1)) * (w - padX * 2);
      const y = h - padY - (row.total / max) * (h - padY * 2);
      return { x, y, etiqueta: row.etiqueta, total: row.total };
    });

    const line = points.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `${points[0].x},${h - padY} ${line} ${points[points.length - 1].x},${h - padY}`;
    return { w, h, line, area, points, last, max };
  }

  private buildDonut(rows: DashboardResumen['distribucion']) {
    const total = rows.reduce((sum, row) => sum + row.valor, 0);
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const colors = ['#0f766e', '#f97316', '#0284c7', '#94a3b8'];

    const slices = rows.map((row, i) => {
      const fraction = total ? row.valor / total : 0;
      const length = fraction * circumference;
      const slice = {
        ...row,
        color: colors[i % colors.length],
        dash: `${length} ${circumference - length}`,
        offset,
        percent: total ? Math.round(fraction * 100) : 0,
      };
      offset -= length;
      return slice;
    });

    return { total, radius, circumference, slices };
  }
}
