import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-movimientos',
  imports: [InventarioNav, DatePipe],
  templateUrl: './movimientos.html',
  styleUrl: './inventario-shared.css',
})
export class Movimientos {
  constructor(readonly inventario: InventarioService) {}

  etiqueta(tipo: 'entrada' | 'salida' | 'ajuste'): string {
    if (tipo === 'entrada') {
      return 'Entrada';
    }
    if (tipo === 'salida') {
      return 'Salida';
    }
    return 'Ajuste';
  }
}
