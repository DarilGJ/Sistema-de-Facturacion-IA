import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Compra, CompraPayload } from '../models/compra.model';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  readonly compras = signal<Compra[]>([]);
  readonly ultima = signal<Compra | null>(null);

  listar(): Observable<Compra[]> {
    return this.http.get<Compra[]>(`${this.api}/compras`).pipe(tap((rows) => this.compras.set(rows)));
  }

  crear(payload: CompraPayload): Observable<Compra> {
    return this.http.post<Compra>(`${this.api}/compras`, payload).pipe(
      tap((row) => {
        this.ultima.set(row);
        this.compras.update((rows) => [row, ...rows]);
      })
    );
  }

  obtener(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.api}/compras/${id}`).pipe(
      tap((row) => {
        this.ultima.set(row);
        this.compras.update((rows) => {
          const exists = rows.some((item) => item.id === id);
          return exists ? rows.map((item) => (item.id === id ? row : item)) : [row, ...rows];
        });
      })
    );
  }

  actualizar(
    id: number,
    payload: Partial<Pick<Compra, 'archivado' | 'estado'>>
  ): Observable<Compra> {
    return this.http.patch<Compra>(`${this.api}/compras/${id}`, payload).pipe(
      tap((row) => {
        this.compras.update((rows) => rows.map((item) => (item.id === id ? row : item)));
      })
    );
  }
}
