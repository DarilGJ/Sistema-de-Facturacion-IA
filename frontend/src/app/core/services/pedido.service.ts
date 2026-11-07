import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FactorPedido {
  etiqueta: string;
  valor: string;
}

export interface LineaPedido {
  id_producto: number;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  proveedor: string;
  existencia: number;
  minimo: number;
  venta90: number;
  temporada: number;
  demandaMensual: number;
  horizonteMeses: number;
  horizonte: string;
  stockSeguridad: number;
  puntoReorden: number;
  diasInventario: number | null;
  movimientoDiario: number;
  pedir: number;
  excedente: number;
  costo: number;
  inversion: number;
  clasificacion: 'A' | 'B' | 'C';
  motivos: string[];
  explicacion: string;
  fuente: string;
  factores: FactorPedido[];
  reparto?: Array<{ id: number; bodega: string; pedir: number; existencia: number }>;
}

export interface BodegaPedido {
  id: number;
  nombre: string;
  principal: boolean;
  ubicacion: string;
  productos: number;
  unidades: number;
  inversion: number;
  lineas: LineaPedido[];
}

export interface PedidoSugerido {
  generadoEn: string;
  motor: string;
  motorDetalle: string;
  temporada: { nombre: string; periodo: string; horizonte: string; preparacion: boolean };
  resumen: { productos: number; unidades: number; inversion: number; bodegas: number };
  bodegas: BodegaPedido[];
  central: LineaPedido[];
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  sugerido(): Observable<PedidoSugerido> {
    return this.http.get<PedidoSugerido>(`${environment.apiUrl}/inventario/pedidos/sugerido`);
  }
}
