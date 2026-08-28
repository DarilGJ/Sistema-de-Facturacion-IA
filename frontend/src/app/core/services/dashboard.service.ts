import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardAlertas, DashboardResumen } from '../models/dashboard.model';

export type DashboardPeriodo = 'hoy' | 'semana' | 'mes' | 'rango';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly resumen = signal<DashboardResumen | null>(null);
  readonly alertas = signal<DashboardAlertas>({ total: 0, items: [] });

  cargar(periodo: DashboardPeriodo, desde?: string, hasta?: string): Observable<DashboardResumen> {
    let params = new HttpParams().set('periodo', periodo);
    if (periodo === 'rango' && desde && hasta) {
      params = params.set('desde', desde).set('hasta', hasta);
    }

    return this.http
      .get<DashboardResumen>(`${this.api}/dashboard`, { params })
      .pipe(tap((data) => this.resumen.set(data)));
  }

  cargarAlertas(): Observable<DashboardAlertas> {
    return this.http
      .get<DashboardAlertas>(`${this.api}/dashboard/alertas`)
      .pipe(tap((data) => this.alertas.set(data)));
  }
}
