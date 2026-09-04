import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Factura, FacturaPatch, FacturaPayload } from '../models/factura.model';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly facturas = signal<Factura[]>([]);
  readonly ultima = signal<Factura | null>(null);

  listar(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.api}/facturas`).pipe(tap((rows) => this.facturas.set(rows)));
  }

  obtener(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.api}/facturas/${id}`).pipe(tap((factura) => this.ultima.set(factura)));
  }

  crear(payload: FacturaPayload): Observable<Factura> {
    return this.http.post<Factura>(`${this.api}/facturas`, payload).pipe(
      tap((factura) => {
        this.ultima.set(factura);
        this.facturas.update((rows) => [factura, ...rows.filter((row) => row.id !== factura.id)]);
      })
    );
  }

  actualizar(id: number, payload: FacturaPatch): Observable<Factura> {
    return this.http.patch<Factura>(`${this.api}/facturas/${id}`, payload).pipe(
      tap((factura) => {
        this.ultima.set(factura);
        this.facturas.update((rows) => rows.map((row) => (row.id === factura.id ? factura : row)));
      })
    );
  }
}
