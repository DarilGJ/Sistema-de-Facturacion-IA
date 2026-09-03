import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cotizacion, CotizacionPayload } from '../models/cotizacion.model';
import { Factura } from '../models/factura.model';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly cotizaciones = signal<Cotizacion[]>([]);
  readonly ultima = signal<Cotizacion | null>(null);

  listar(): Observable<Cotizacion[]> {
    return this.http
      .get<Cotizacion[]>(`${this.api}/cotizaciones`)
      .pipe(tap((rows) => this.cotizaciones.set(rows)));
  }

  crear(payload: CotizacionPayload): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.api}/cotizaciones`, payload).pipe(
      tap((row) => {
        this.ultima.set(row);
        this.cotizaciones.update((rows) => [row, ...rows]);
      })
    );
  }

  actualizar(id: number, payload: Partial<Pick<Cotizacion, 'estado' | 'generada'>>): Observable<Cotizacion> {
    return this.http.patch<Cotizacion>(`${this.api}/cotizaciones/${id}`, payload).pipe(
      tap((row) => {
        this.cotizaciones.update((rows) => rows.map((item) => (item.id === id ? row : item)));
      })
    );
  }

  convertirAFactura(id: number): Observable<{ factura: Factura; cotizacion: Cotizacion }> {
    return this.http.post<{ factura: Factura; cotizacion: Cotizacion }>(`${this.api}/cotizaciones/${id}/facturar`, {}).pipe(
      tap((res) => {
        this.cotizaciones.update((rows) =>
          rows.map((item) => (item.id === res.cotizacion.id ? res.cotizacion : item))
        );
      })
    );
  }
}
