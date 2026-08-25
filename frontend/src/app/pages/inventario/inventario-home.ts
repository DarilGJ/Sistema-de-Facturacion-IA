import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventarioNav } from './inventario-nav';
import { InventarioService } from '../../core/services/inventario.service';

@Component({
  selector: 'app-inventario-home',
  imports: [RouterLink, InventarioNav],
  templateUrl: './inventario-home.html',
  styleUrls: ['./inventario-shared.css', './inventario-home.css'],
})
export class InventarioHome {
  constructor(readonly inventario: InventarioService) {}

  stockBajo(): number {
    return this.inventario.existencias().filter((item) => item.cantidad < item.minimo).length;
  }
}
